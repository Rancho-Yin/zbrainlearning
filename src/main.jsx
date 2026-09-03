import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  ChartNoAxesCombined,
  ChevronRight,
  Clock3,
  CloudUpload,
  FileText,
  Film,
  FolderOpen,
  GraduationCap,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  LogOut,
  ListOrdered,
  Menu,
  MessageSquareText,
  MoveDown,
  MoveUp,
  Network,
  Play,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserPlus,
  UserRound,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { getCurrentUser, login, logout, register } from './auth';
import { presentationReplays, presentations, recordings } from './data';
import { applyOrdering, isDirectMediaUrl, normalizeSyncedVideos } from './content-utils';
import {
  clearPublishingToken,
  getPublishingToken,
  isSuperAdmin,
  loadSharedContent,
  publishSharedContent,
  savePublishingToken,
  validatePublishingToken,
} from './github-content';
import './styles.css';

const LOGO_SRC = `${import.meta.env.BASE_URL}assets/zhixian-robot-logo.png`;
const COVER_ASSETS = [
  'assets/covers/ai-showroom.png',
  'assets/covers/digital-media-education.png',
  'assets/covers/partner-training.png',
];
const PRESENTATION_STORAGE_KEY = 'zbrainlearning-custom-presentations-v1';
const RECORDING_STORAGE_KEY = 'zbrainlearning-custom-recordings-v1';
const ECOSYSTEM_VIDEO_STORAGE_KEY = 'zbrainlearning-custom-ecosystem-videos-v1';
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);
const CURRENT_DATE = new Date().toLocaleDateString('en-CA');
const CUSTOM_GROUP_VALUE = '__custom_group__';
const LIBRARY_CONFIG = {
  intelligent: {
    section: 'presentations',
    label: '智能方案讲解',
    kicker: 'INTELLIGENT SOLUTION LIBRARY',
    description: '按公司、解决方案和案例归档，快速匹配不同客户的沟通场景。',
    emptyTitle: '没有找到相关智能方案',
    emptyDescription: '换一个公司、行业或案例名称试试。',
    groups: [
      { id: 'company', label: '公司介绍', description: '了解智显机器人与合作伙伴的业务能力、品牌定位与核心优势。' },
      { id: 'solution', label: '解决方案介绍', description: '按展厅、教育、能源与 AIGC 等场景查找可直接讲解的方案。' },
      { id: 'case', label: '案例介绍', description: '通过已落地的展厅、能源与文旅案例，辅助客户沟通与项目转化。' },
    ],
  },
  ecosystem: {
    section: 'ecosystem',
    label: '生态解决方案',
    kicker: 'ECOSYSTEM SOLUTION LIBRARY',
    description: '汇集生态伙伴、协同产品与联合方案，扩展代理商可交付的场景能力。',
    emptyTitle: '生态方案正在持续建设',
    emptyDescription: '点击“新增方案”，录入生态伙伴资料或联合解决方案。',
    groups: [
      { id: 'ecosystem-partner', label: '生态伙伴', description: '沉淀合作伙伴介绍、能力边界与协同价值。' },
      { id: 'ecosystem-product', label: '生态产品', description: '收录可与智显机器人协同交付的产品与能力组件。' },
      { id: 'joint-solution', label: '联合解决方案', description: '面向具体行业与客户场景组合生态能力，形成联合方案。' },
    ],
  },
};

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

function isWebUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function normalizeSyncedPresentations(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item?.title && isWebUrl(item?.url)).map((item) => ({
    id: item.id ? String(item.id).slice(0, 160) : `shared-presentation-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: String(item.title).slice(0, 160),
    url: String(item.url),
    library: item.library === 'ecosystem' ? 'ecosystem' : 'intelligent',
    group: String(item.group || 'solution').slice(0, 100),
    groupLabel: String(item.groupLabel || '').slice(0, 100),
    groupDescription: String(item.groupDescription || '').slice(0, 300),
    category: String(item.category || '自定义方案').slice(0, 100),
    publishedAt: /^\d{4}-\d{2}-\d{2}$/.test(item.publishedAt || '') ? item.publishedAt : '',
    cover: COVER_ASSETS.includes(item.cover) ? item.cover : COVER_ASSETS[0],
    isCustom: true,
  }));
}

function normalizeSyncedRecordings(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item?.title && item?.date && isWebUrl(item?.url)).map((item) => ({
    id: item.id ? String(item.id).slice(0, 160) : `shared-recording-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: String(item.title).slice(0, 160),
    url: String(item.url),
    date: /^\d{4}-\d{2}-\d{2}$/.test(item.date) ? item.date : CURRENT_DATE,
    time: /^\d{2}:\d{2}$/.test(item.time || '') ? item.time : '00:00',
    phase: String(item.phase || '同步课程').slice(0, 80),
    summary: String(item.summary || '通过设备同步导入的培训回放。').slice(0, 500),
    isCustom: true,
  }));
}

function mergeSharedItems(current, incoming, type) {
  const keyOf = type === 'presentation'
    ? (item) => `${item.library || 'intelligent'}|${item.title}|${item.url}`
    : type === 'video'
      ? (item) => `${item.title}|${item.url}`
    : (item) => `${item.date}|${item.title}|${item.url}`;
  const known = new Set(current.map(keyOf));
  const additions = incoming.filter((item) => {
    const key = keyOf(item);
    if (known.has(key)) return false;
    known.add(key);
    return true;
  }).map((item, index) => ({
    ...item,
    id: item.id || `shared-${type}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    isCustom: true,
  }));
  return { items: [...current, ...additions], added: additions.length };
}

function loadCustomPresentations() {
  try {
    const value = JSON.parse(localStorage.getItem(PRESENTATION_STORAGE_KEY) || '[]');
    return Array.isArray(value)
      ? value.filter((item) => item?.id && item?.title && item?.url).map((item) => ({
        ...item,
        library: item.library || 'intelligent',
        group: item.group || 'solution',
      }))
      : [];
  } catch {
    return [];
  }
}

function getLibraryGroups(items, library) {
  const defaults = LIBRARY_CONFIG[library].groups;
  const groups = [...defaults];
  const knownIds = new Set(defaults.map((group) => group.id));
  items.forEach((item) => {
    if ((item.library || 'intelligent') !== library || !item.group || knownIds.has(item.group)) return;
    groups.push({
      id: item.group,
      label: item.groupLabel || item.group,
      description: item.groupDescription || '用户自主添加的方案分类。',
      isCustom: true,
    });
    knownIds.add(item.group);
  });
  return groups;
}

function loadCustomRecordings() {
  try {
    const value = JSON.parse(localStorage.getItem(RECORDING_STORAGE_KEY) || '[]');
    return Array.isArray(value)
      ? value.filter((item) => item?.id && item?.title && item?.url && item?.date)
      : [];
  } catch {
    return [];
  }
}

function loadCustomEcosystemVideos() {
  try {
    const value = JSON.parse(localStorage.getItem(ECOSYSTEM_VIDEO_STORAGE_KEY) || '[]');
    return Array.isArray(value) ? normalizeSyncedVideos(value) : [];
  } catch {
    return [];
  }
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'short',
});

function Brand() {
  return (
    <a className="brand" href="#top" aria-label="返回智显机器人AI训战中心首页">
      <img src={LOGO_SRC} alt="智显机器人" />
      <span className="brand-divider" />
      <span className="brand-site-name">AI训战中心</span>
    </a>
  );
}

function Sidebar({ solutionCount, ecosystemCount, replayCount, section, onSectionChange, activeNav, onActiveNavChange, open, onClose }) {
  const items = [
    { id: 'overview', label: '首页', icon: FolderOpen, href: '#top' },
    { id: 'presentations', label: '智能方案讲解', icon: FileText, href: '#library', count: solutionCount },
    { id: 'ecosystem', label: '生态解决方案', icon: Network, href: '#library', count: ecosystemCount },
    { id: 'recordings', label: '会议回放', icon: Video, href: '#library', count: replayCount },
  ];

  const navigate = (item) => {
    if (item.id === 'recordings' || item.id === 'presentations' || item.id === 'ecosystem') onSectionChange(item.id);
    if (item.id === 'overview') onSectionChange('all');
    onActiveNavChange(item.id);
    document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
    onClose();
  };

  return (
    <>
      <button className={`sidebar-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-label="关闭导航" />
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-head">
          <Brand />
          <button className="icon-button mobile-only" onClick={onClose} aria-label="关闭导航"><X /></button>
        </div>
        <nav aria-label="内容导航">
          <p className="nav-label">学习导航</p>
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeNav;
            return (
              <button key={item.id} className={`nav-item ${active ? 'is-active' : ''}`} onClick={() => navigate(item)}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
                {item.count !== undefined && <b>{String(item.count).padStart(2, '0')}</b>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-program">
          <span><Sparkles /> PARTNER ENABLEMENT</span>
          <p>从理解产品到赢得客户，构建代理商持续成长的业务能力。</p>
        </div>
        <p className="sidebar-footer">智显机器人 · AI PARTNER ACADEMY</p>
      </aside>
    </>
  );
}

function userLabel(user) {
  return user?.display_name || user?.displayName || user?.name || user?.username || 'ZBrain 用户';
}

function Topbar({ query, setQuery, onMenu, user, onLogout, superAdmin, onPublishingSettings, onSortSettings }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onMenu} aria-label="打开导航"><Menu /></button>
      <div className="search-box">
        <Search aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索视频、PPT、智能方案或生态方案..."
          aria-label="搜索视频、PPT、智能方案或生态方案"
        />
        <kbd>⌘ K</kbd>
      </div>
      <div className="account-actions">
        {superAdmin && <button className="admin-sort-button" onClick={onSortSettings} title="管理内容排序"><ListOrdered aria-hidden="true" /><span>内容排序</span></button>}
        {superAdmin && <button className="admin-settings-button" onClick={onPublishingSettings} title="GitHub 全账号发布设置"><ShieldCheck aria-hidden="true" /><span>超级管理员</span></button>}
        <div className="account-name" title={userLabel(user)}><UserRound aria-hidden="true" /><span>{userLabel(user)}</span></div>
        <button className="logout-button" onClick={onLogout} title="退出登录"><LogOut aria-hidden="true" /><span>退出</span></button>
      </div>
    </header>
  );
}

function Hero({ onBrowse, onAbout }) {
  return (
    <section className="hero" id="top">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy">
        <div className="hero-brand-line"><img src={LOGO_SRC} alt="" /><span>代理商成长与销售赋能平台</span></div>
        <h1><span>智显机器人</span><span>AI训战中心</span></h1>
        <p>面向智显机器人全国代理商打造的知识与实战平台。系统学习产品价值、场景方案、演示方法与销售策略，把专业能力转化为客户信任，把每一次学习转化为业务增长。</p>
        <div className="hero-actions">
          <button className="primary-button" onClick={onBrowse}>开启赋能学习 <ChevronRight /></button>
          <a className="secondary-button" href="#about" onClick={onAbout}>了解智显机器人 <ArrowRight /></a>
        </div>
        <div className="hero-proof">
          <span><BadgeCheck /> 官方内容沉淀</span>
          <span><Target /> 面向业务实战</span>
          <span><Zap /> 持续更新赋能</span>
        </div>
      </div>

      <div className="hero-visual" aria-label="智显机器人代理商能力引擎">
        <div className="visual-grid" />
        <div className="visual-ring ring-one" />
        <div className="visual-ring ring-two" />
        <div className="visual-axis axis-x" />
        <div className="visual-axis axis-y" />
        <div className="ai-core">
          <span className="core-scan" />
          <Bot />
          <strong>AI</strong>
          <small>PARTNER GROWTH ENGINE</small>
        </div>
        <div className="data-node node-one"><span>01</span><b>产品理解</b><small>PRODUCT</small></div>
        <div className="data-node node-two"><span>02</span><b>方案表达</b><small>SOLUTION</small></div>
        <div className="data-node node-three"><span>03</span><b>销售转化</b><small>GROWTH</small></div>
        <div className="signal-bars"><i /><i /><i /><i /><i /></div>
      </div>
    </section>
  );
}

function Stats({ presentationCount, recordingCount }) {
  const stats = [
    { value: recordingCount, label: '场实战会议回放', icon: Video, detail: '训战内容持续补充中' },
    { value: presentationCount || '待', label: '份智能方案讲解', icon: FileText, detail: '三类方案持续补充中' },
    { value: '4', label: '阶段代理商路径', icon: ChartNoAxesCombined, detail: '从懂产品到促成交' },
  ];
  return (
    <section className="stats-band" aria-label="平台内容统计">
      {stats.map(({ value, label, icon: Icon, detail }) => (
        <div className="stat" key={label}>
          <Icon aria-hidden="true" />
          <div><strong>{value}</strong><span>{label}</span><small>{detail}</small></div>
        </div>
      ))}
    </section>
  );
}

const capabilities = [
  { icon: Bot, number: '01', title: '产品认知', text: '理解智显机器人的产品逻辑、核心能力与客户价值，能够用客户听得懂的语言讲清“为什么需要”。' },
  { icon: Presentation, number: '02', title: '场景方案', text: '围绕客户行业、空间与业务目标组合方案，把单一产品介绍升级为清晰、完整、可落地的解决方案。' },
  { icon: MessageSquareText, number: '03', title: '演示表达', text: '掌握产品演示、方案汇报与价值呈现方法，在有限沟通时间内建立专业度并激发客户兴趣。' },
  { icon: Target, number: '04', title: '销售转化', text: '沉淀需求挖掘、异议应对和推进节奏，帮助代理商缩短学习周期，更有把握地推动项目成交。' },
];

function About() {
  return (
    <section className="about-section" id="about">
      <div className="section-intro">
        <p className="section-kicker">ABOUT ZHIXIAN ROBOT</p>
        <h2>给屏幕装上大脑、五官、手脚，<br />让屏幕像人一样为我们服务。</h2>
      </div>
      <div className="about-body">
        <div className="about-copy">
          <p className="lead">智显机器人由洲明显示、智谱大模型与凌云光视觉等生态能力协同打造，专注显示、感知、交互与内容呈现，让 AI 在大屏、商显和真实公共空间中被看见、被使用。</p>
          <p>区别于人形机器人，智显机器人把屏幕升级为客户身边的智能交互入口：它可以成为会讲解、会沟通的 AI 销售员，也可以成为永远在线的数字员工。围绕营销、运营与工具三类核心场景，帮助企业把 AI 接入客户体验与业务流程，创造可感知、可衡量的实际价值。</p>
          <div className="about-quote"><Sparkles /><span>智显机器人不是最能跳的机器人，而是最能讲的机器人。让每一块屏幕都成为可呈现的 AI。</span></div>
          <a className="website-link" href="https://www.zbrain.cn" target="_blank" rel="noreferrer">
            <span><strong>访问智显机器人官网</strong><small>查看完整产品场景、解决方案与合作信息</small></span>
            <ArrowUpRight />
          </a>
        </div>
        <div className="capability-matrix">
          <div className="matrix-head"><span>核心客户价值</span><small>ZHIXIAN VALUE SYSTEM</small></div>
          {[
            ['营销 Marketing', 'AI 销售员与营销展厅'],
            ['运营 Operations', '数据驱动与智能决策'],
            ['工具 Tools', '内容生产与交互呈现'],
            ['安全 Security', '私有部署与信创适配'],
          ].map(([item, detail], index) => (
            <div className="matrix-row" key={item}><b>0{index + 1}</b><span><strong>{item}</strong><small>{detail}</small></span><i><em style={{ width: `${94 - index * 8}%` }} /></i></div>
          ))}
          <div className="matrix-statement"><Bot /><span>让 AI 应用被看见，<br />让客户把 AI 用起来。</span></div>
        </div>
      </div>
    </section>
  );
}

function Enablement() {
  return (
    <section className="enablement-section" id="enablement">
      <div className="section-heading light-heading">
        <div><p className="section-kicker">PARTNER ENABLEMENT PATH</p><h2>一条面向成交的学习路径</h2></div>
        <p>学习不是终点。我们用真实内容和实战方法，帮助代理商把知识转化为客户沟通、方案设计与项目推进能力。</p>
      </div>
      <div className="enablement-path">
        {capabilities.map(({ icon: Icon, number, title, text }) => (
          <article className="enablement-step" key={number}>
            <div className="step-top"><span>{number}</span><Icon /></div>
            <h3>{title}</h3><p>{text}</p>
          </article>
        ))}
      </div>
      <div className="sales-loop">
        <div><p className="section-kicker">FROM LEARNING TO GROWTH</p><h3>每一次学习，都服务于一次真实业务推进</h3></div>
        <div className="loop-flow">
          {['识别客户需求', '匹配场景方案', '呈现产品价值', '推进项目成交'].map((item, index) => (
            <React.Fragment key={item}><span><b>{index + 1}</b>{item}</span>{index < 3 && <ArrowRight />}</React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecordingRow({ recording, index, onRemove }) {
  const date = new Date(`${recording.date}T12:00:00`);
  return (
    <article className={`recording-row ${recording.featured ? 'is-featured' : ''}`}>
      <div className="row-index">{String(index + 1).padStart(2, '0')}</div>
      <div className="row-line"><span /></div>
      <div className="row-date"><strong>{dateFormatter.format(date).replace('星期', '周')}</strong><span>{recording.date}</span></div>
      <div className="row-content">
        <div className="type-label">
          <Video /> {recording.phase.replaceAll(' ', '')} · 代理商训战回放
          {recording.isCustom && onRemove && (
            <button className="recording-remove" onClick={() => onRemove(recording.id)} aria-label={`删除${recording.title}`} title="删除自定义视频">
              <Trash2 />
            </button>
          )}
        </div>
        <h3>{recording.title}</h3>
        <p className="recording-summary">{recording.summary}</p>
        <p className="recording-time"><Clock3 /> {recording.time} 开始</p>
      </div>
      <a className="play-button" href={recording.url} target="_blank" rel="noreferrer"><Play fill="currentColor" /><span>观看回放</span><ArrowUpRight /></a>
    </article>
  );
}

function AddRecordingDialog({ open, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState(CURRENT_DATE);
  const [time, setTime] = useState('14:00');
  const [phase, setPhase] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    const cleanedTitle = title.trim();
    const cleanedUrl = url.trim().replace(/[，,。；;]+$/, '');
    const cleanedSummary = summary.trim();
    if (!cleanedTitle || !cleanedUrl || !date || !cleanedSummary) {
      setError('请填写视频名称、回放网址、培训日期和主题概览。');
      return;
    }
    try {
      const parsedUrl = new URL(cleanedUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('invalid protocol');
      onAdd({
        title: cleanedTitle,
        url: parsedUrl.href,
        date,
        time: time || '00:00',
        phase: phase.trim() || '新增课程',
        summary: cleanedSummary,
      });
      setTitle('');
      setUrl('');
      setDate(CURRENT_DATE);
      setTime('14:00');
      setPhase('');
      setSummary('');
      setError('');
    } catch {
      setError('请输入以 http:// 或 https:// 开头的有效回放网址。');
    }
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="add-dialog add-recording-dialog" role="dialog" aria-modal="true" aria-labelledby="add-recording-title">
        <div className="add-dialog-head">
          <div><span>ADD VIDEO REPLAY</span><h3 id="add-recording-title">新增视频回放</h3></div>
          <button className="dialog-close" onClick={onClose} aria-label="关闭新增视频窗口"><X /></button>
        </div>
        <form onSubmit={submit} noValidate>
          <label>
            <span>视频名称</span>
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="输入本期培训主题" />
          </label>
          <label>
            <span>回放网址</span>
            <div className="url-input"><Link2 /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://meeting.tencent.com/..." inputMode="url" /></div>
          </label>
          <div className="dialog-field-row">
            <label>
              <span>培训日期</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              <span>开始时间 <small>选填</small></span>
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
            </label>
          </div>
          <label>
            <span>课程期数 <small>选填</small></span>
            <input value={phase} onChange={(event) => setPhase(event.target.value)} placeholder="例如：第 7 期" />
          </label>
          <label>
            <span>培训主题概览</span>
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="填写本期涉及的产品、方案、案例或销售方法，便于代理商快速了解内容。" rows="4" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="dialog-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="dialog-submit"><Plus /> 添加到视频回放</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function AddEcosystemVideoDialog({ open, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('生态介绍');
  const [summary, setSummary] = useState('');
  const [cover, setCover] = useState(COVER_ASSETS[2]);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!open) return undefined;
    setTitle('');
    setUrl('');
    setCategory('生态介绍');
    setSummary('');
    setCover(COVER_ASSETS[2]);
    setError('');
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    const cleanedTitle = title.trim();
    const cleanedUrl = url.trim().replace(/[，,。；;]+$/, '');
    const cleanedCategory = category.trim();
    const cleanedSummary = summary.trim();
    if (!cleanedTitle || !cleanedUrl || !cleanedCategory) {
      setError('请填写视频名称、视频链接和视频分类。');
      return;
    }
    try {
      const parsedUrl = new URL(cleanedUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('invalid protocol');
      onAdd({ title: cleanedTitle, url: parsedUrl.href, category: cleanedCategory, summary: cleanedSummary || '生态解决方案视频介绍。', cover, createdAt: CURRENT_DATE });
      setTitle('');
      setUrl('');
      setSummary('');
      setError('');
    } catch {
      setError('请输入以 http:// 或 https:// 开头的有效视频链接。');
    }
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="add-dialog add-ecosystem-video-dialog" role="dialog" aria-modal="true" aria-labelledby="add-ecosystem-video-title">
        <div className="add-dialog-head"><div><span>ADD ECOSYSTEM VIDEO</span><h3 id="add-ecosystem-video-title">新增生态视频</h3></div><button className="dialog-close" onClick={onClose} aria-label="关闭新增生态视频窗口"><X /></button></div>
        <form onSubmit={submit} noValidate>
          <label><span>视频名称</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="输入视频名称" /></label>
          <label><span>视频链接</span><div className="url-input"><Link2 /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." inputMode="url" /></div></label>
          <label><span>视频分类 <small>可自主添加分类</small></span><input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="例如：生态伙伴、产品演示" /></label>
          <label><span>视频简介 <small>选填</small></span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="简要说明视频内容，帮助代理商快速判断是否观看。" rows="3" /></label>
          <label><span>视频封面</span><select value={cover} onChange={(event) => setCover(event.target.value)}><option value={COVER_ASSETS[0]}>AI 展厅</option><option value={COVER_ASSETS[1]}>数字媒体</option><option value={COVER_ASSETS[2]}>伙伴培训</option></select></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions"><button type="button" className="dialog-cancel" onClick={onClose}>取消</button><button type="submit" className="dialog-submit"><Plus /> 添加到生态视频</button></div>
        </form>
      </section>
    </div>
  );
}

function PresentationCard({ presentation, index, onRemove, openLabel = '打开方案' }) {
  const cover = presentation.cover || COVER_ASSETS[index % COVER_ASSETS.length];
  const monthLabel = presentation.publishedAt?.slice(0, 7).replace('-', '.');
  return (
    <article className="presentation-card">
      <div className="presentation-card-head">
        <span className="presentation-index">{String(index + 1).padStart(2, '0')}{monthLabel && <small>{monthLabel}</small>}</span>
        <div className="presentation-card-meta">
          <span className="presentation-category"><Presentation /> {presentation.category || '产品方案'}</span>
          {presentation.isCustom && onRemove && (
            <button className="presentation-remove" onClick={() => onRemove(presentation.id)} aria-label={`删除${presentation.title}`} title="删除自定义方案">
              <Trash2 />
            </button>
          )}
        </div>
      </div>
      <a className="presentation-cover" href={presentation.url} target="_blank" rel="noreferrer" aria-label={`打开${presentation.title}`}>
        <img src={assetUrl(cover)} alt="" loading={index < 3 ? 'eager' : 'lazy'} />
        <span><FileText /> PPT</span>
      </a>
      <div className="presentation-card-body">
        <a className="presentation-title" href={presentation.url} target="_blank" rel="noreferrer">
          {presentation.title}
        </a>
      </div>
      <a className="presentation-open" href={presentation.url} target="_blank" rel="noreferrer">
        <span>{openLabel}</span><ArrowUpRight />
      </a>
    </article>
  );
}

function AddPresentationDialog({ open, defaultLibrary, groupsByLibrary, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [library, setLibrary] = useState(defaultLibrary || 'intelligent');
  const [group, setGroup] = useState(() => groupsByLibrary[defaultLibrary || 'intelligent']?.[0]?.id || CUSTOM_GROUP_VALUE);
  const [customGroupName, setCustomGroupName] = useState('');
  const [customGroupDescription, setCustomGroupDescription] = useState('');
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (!open) return undefined;
    const nextLibrary = defaultLibrary || 'intelligent';
    setLibrary(nextLibrary);
    setGroup(groupsByLibrary[nextLibrary]?.[0]?.id || CUSTOM_GROUP_VALUE);
    setCustomGroupName('');
    setCustomGroupDescription('');
    setError('');
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [defaultLibrary, groupsByLibrary, onClose, open]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    const cleanedTitle = title.trim();
    const cleanedUrl = url.trim().replace(/[，,。；;]+$/, '');
    if (!cleanedTitle || !cleanedUrl) {
      setError('请填写方案名称和网址。');
      return;
    }
    const cleanedGroupName = customGroupName.trim();
    if (group === CUSTOM_GROUP_VALUE && !cleanedGroupName) {
      setError('请填写新的一级分类名称。');
      return;
    }
    try {
      const parsedUrl = new URL(cleanedUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('invalid protocol');
      const libraryGroups = groupsByLibrary[library] || [];
      const matchedGroup = group === CUSTOM_GROUP_VALUE
        ? libraryGroups.find((item) => item.label.toLowerCase() === cleanedGroupName.toLowerCase())
        : libraryGroups.find((item) => item.id === group);
      const nextGroup = matchedGroup?.id || `custom-group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      onAdd({
        title: cleanedTitle,
        url: parsedUrl.href,
        library,
        group: nextGroup,
        groupLabel: matchedGroup?.label || cleanedGroupName,
        groupDescription: matchedGroup?.description || customGroupDescription.trim() || '用户自主添加的方案分类。',
        category: category.trim() || '自定义方案',
        publishedAt: month ? `${month}-01` : '',
      });
      setTitle('');
      setUrl('');
      setGroup(groupsByLibrary[library]?.[0]?.id || CUSTOM_GROUP_VALUE);
      setCustomGroupName('');
      setCustomGroupDescription('');
      setCategory('');
      setMonth(CURRENT_MONTH);
      setError('');
    } catch {
      setError('请输入以 http:// 或 https:// 开头的有效网址。');
    }
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="add-dialog" role="dialog" aria-modal="true" aria-labelledby="add-presentation-title">
        <div className="add-dialog-head">
          <div><span>ADD NEW SOLUTION</span><h3 id="add-presentation-title">新增方案</h3></div>
          <button className="dialog-close" onClick={onClose} aria-label="关闭新增方案窗口"><X /></button>
        </div>
        <form onSubmit={submit} noValidate>
          <label>
            <span>方案名称</span>
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="输入方案名称" />
          </label>
          <label>
            <span>方案网址</span>
            <div className="url-input"><Link2 /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" inputMode="url" /></div>
          </label>
          <label>
            <span>归属模块</span>
            <select value={library} onChange={(event) => {
              const nextLibrary = event.target.value;
              setLibrary(nextLibrary);
              setGroup(groupsByLibrary[nextLibrary]?.[0]?.id || CUSTOM_GROUP_VALUE);
              setCustomGroupName('');
              setCustomGroupDescription('');
            }}>
              {Object.entries(LIBRARY_CONFIG).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            <span>一级分类</span>
            <select value={group} onChange={(event) => setGroup(event.target.value)}>
              {(groupsByLibrary[library] || []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              <option value={CUSTOM_GROUP_VALUE}>＋ 自主添加一级分类</option>
            </select>
          </label>
          {group === CUSTOM_GROUP_VALUE && (
            <div className="custom-group-fields">
              <label>
                <span>新分类名称</span>
                <input value={customGroupName} onChange={(event) => setCustomGroupName(event.target.value)} placeholder="例如：数字人生态" />
              </label>
              <label>
                <span>分类说明 <small>选填</small></span>
                <input value={customGroupDescription} onChange={(event) => setCustomGroupDescription(event.target.value)} placeholder="简要说明这一类方案的用途" />
              </label>
            </div>
          )}
          <label>
            <span>细分标签 <small>选填</small></span>
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="例如：展厅方案、能源案例" />
          </label>
          <label>
            <span>方案月份 <small>用于倒序排列</small></span>
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="dialog-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="dialog-submit"><Plus /> 添加到{LIBRARY_CONFIG[library].label}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PublishingSettingsDialog({ open, onClose, presentationCount, recordingCount, ecosystemVideoCount, onTokenReady, onPublish, publishing }) {
  const [token, setToken] = useState(getPublishingToken);
  const [showToken, setShowToken] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(Boolean(getPublishingToken()));

  React.useEffect(() => {
    if (!open) return undefined;
    const savedToken = getPublishingToken();
    setToken(savedToken);
    setVerified(Boolean(savedToken));
    setError('');
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  if (!open) return null;

  const verify = async () => {
    const cleanedToken = token.trim();
    if (!cleanedToken) {
      setError('请输入 GitHub Fine-grained Token。');
      return;
    }
    setChecking(true);
    setError('');
    try {
      await validatePublishingToken(cleanedToken);
      savePublishingToken(cleanedToken);
      setVerified(true);
      onTokenReady(cleanedToken);
    } catch (validationError) {
      clearPublishingToken();
      setVerified(false);
      setError(validationError instanceof Error ? validationError.message : 'GitHub 发布令牌验证失败。');
    } finally {
      setChecking(false);
    }
  };

  const disconnect = () => {
    clearPublishingToken();
    setToken('');
    setVerified(false);
    setError('');
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="add-dialog publishing-dialog" role="dialog" aria-modal="true" aria-labelledby="publishing-dialog-title">
        <div className="add-dialog-head">
          <div><span>GITHUB SHARED PUBLISHING</span><h3 id="publishing-dialog-title">全账号发布设置</h3></div>
          <button className="dialog-close" onClick={onClose} aria-label="关闭发布设置"><X /></button>
        </div>
        <div className="publishing-dialog-body">
          <div className={`publishing-state ${verified ? 'is-ready' : ''}`}>
            {verified ? <BadgeCheck /> : <ShieldCheck />}
            <div><strong>{verified ? 'GitHub 发布通道已启用' : '仅超级管理员可启用发布'}</strong><span>{verified ? '新增、编辑和删除会同步给所有平台账号。' : '令牌只保存在当前浏览器会话，关闭浏览器后自动清除。'}</span></div>
          </div>
          <label className="publishing-token-field">
            <span>GitHub Fine-grained Token</span>
            <div className="auth-input"><KeyRound aria-hidden="true" /><input type={showToken ? 'text' : 'password'} value={token} onChange={(event) => { setToken(event.target.value); setVerified(false); }} placeholder="github_pat_..." autoComplete="off" /><button type="button" onClick={() => setShowToken((current) => !current)} aria-label={showToken ? '隐藏令牌' : '显示令牌'}>{showToken ? <EyeOff /> : <Eye />}</button></div>
          </label>
          <p className="publishing-note">令牌仅授权 <b>Rancho-Yin/zbrainlearning</b>，Repository permissions 选择 <b>Contents: Read and write</b>。</p>
          <a className="publishing-token-link" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">前往 GitHub 创建令牌 <ArrowUpRight /></a>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="publishing-counts"><span><FileText /> {presentationCount} 个共享方案</span><span><Video /> {recordingCount} 个共享视频</span><span><Film /> {ecosystemVideoCount} 个生态视频</span></div>
          <div className="dialog-actions publishing-actions">
            {verified ? <button type="button" className="dialog-cancel" onClick={disconnect}>断开令牌</button> : <button type="button" className="dialog-cancel" onClick={verify} disabled={checking}>{checking ? <RefreshCw className="is-spinning" /> : <ShieldCheck />} 验证并启用</button>}
            <button type="button" className="dialog-submit" onClick={() => onPublish(token.trim())} disabled={!verified || publishing}>{publishing ? <RefreshCw className="is-spinning" /> : <CloudUpload />} {publishing ? '正在发布...' : '发布当前全部内容'}</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function VideoPlayerDialog({ video, onClose }) {
  React.useEffect(() => {
    if (!video) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, video]);

  if (!video) return null;
  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="add-dialog video-player-dialog" role="dialog" aria-modal="true" aria-labelledby="video-player-title">
        <div className="add-dialog-head"><div><span>ECOSYSTEM VIDEO</span><h3 id="video-player-title">{video.title}</h3></div><button className="dialog-close" onClick={onClose} aria-label="关闭视频播放器"><X /></button></div>
        <div className="video-player-body">
          {isDirectMediaUrl(video.url) ? <video controls autoPlay playsInline poster={assetUrl(video.cover)} src={video.url}>你的浏览器不支持视频播放。</video> : <div className="external-video-state"><ExternalLinkIcon /><h4>该链接来自外部视频平台</h4><p>当前地址不是可直接嵌入的媒体文件，将在新标签页打开原始回放页面。</p><a className="dialog-submit" href={video.url} target="_blank" rel="noreferrer">打开视频页面 <ArrowUpRight /></a></div>}
        </div>
      </section>
    </div>
  );
}

function ExternalLinkIcon(props) {
  return <ArrowUpRight {...props} />;
}

function EcosystemVideoCard({ video, index, onRemove, onPlay }) {
  return (
    <article className="ecosystem-video-card">
      <button className="ecosystem-video-cover" onClick={() => onPlay(video)} aria-label={`播放${video.title}`}>
        <img src={assetUrl(video.cover || COVER_ASSETS[2])} alt="" loading={index < 3 ? 'eager' : 'lazy'} />
        <span><Film /> {isDirectMediaUrl(video.url) ? '站内播放' : '打开回放'}</span>
        <i><Play fill="currentColor" /></i>
      </button>
      <div className="ecosystem-video-body">
        <div className="ecosystem-video-meta"><span>{String(index + 1).padStart(2, '0')}</span><b>{video.category || '生态介绍'}</b>{video.isCustom && onRemove && <button className="presentation-remove" onClick={() => onRemove(video.id)} aria-label={`删除${video.title}`} title="删除生态视频"><Trash2 /></button>}</div>
        <h4>{video.title}</h4>
        <p>{video.summary}</p>
      </div>
    </article>
  );
}

function EcosystemVideoLibrary({ items, onAddClick, onRemove, canManage, onPlay }) {
  const groups = useMemo(() => {
    const grouped = new Map();
    items.forEach((item) => {
      const category = item.category || '生态介绍';
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(item);
    });
    return [...grouped.entries()];
  }, [items]);

  return (
    <section className="presentation-library ecosystem-video-library" aria-label="生态视频介绍列表">
      <div className="presentation-library-head"><div><p className="section-kicker">ECOSYSTEM VIDEO LIBRARY</p><h3>生态视频介绍</h3></div><div className="presentation-library-actions"><p>按分类沉淀生态伙伴、产品与联合方案视频，帮助代理商快速理解可交付能力。</p>{canManage && <button onClick={onAddClick}><Plus /> 添加视频</button>}</div></div>
      {groups.length ? groups.map(([category, categoryItems]) => <section className="ecosystem-video-group" key={category}><div className="ecosystem-video-group-head"><span>{String(groups.findIndex(([name]) => name === category) + 1).padStart(2, '0')}</span><h4>{category}</h4><b>{String(categoryItems.length).padStart(2, '0')}</b></div><div className="ecosystem-video-grid">{categoryItems.map((video, index) => <EcosystemVideoCard key={video.id} video={video} index={index} onRemove={onRemove} onPlay={onPlay} />)}</div></section>) : <div className="no-results ecosystem-video-empty"><Film /><h3>生态视频正在持续建设</h3><p>{canManage ? '点击“添加视频”，录入可播放的视频链接与分类。' : '超级管理员发布后，生态视频会自动同步到这里。'}</p>{canManage && <button className="empty-add-button" onClick={onAddClick}><Plus /> 添加视频</button>}</div>}
    </section>
  );
}

function SortDialog({ open, lists, onClose, onSave, saving }) {
  const [activeList, setActiveList] = useState(lists[0]?.id || 'recordings');
  const [draft, setDraft] = useState({});

  React.useEffect(() => {
    if (!open) return;
    setActiveList(lists[0]?.id || 'recordings');
    setDraft(Object.fromEntries(lists.map((list) => [list.id, list.items.map((item) => item.id)])));
  }, [open, lists]);

  if (!open) return null;
  const current = lists.find((list) => list.id === activeList) || lists[0];
  const orderedItems = applyOrdering(current?.items || [], draft[current?.id] || []);
  const move = (index, direction) => {
    const ids = orderedItems.map((item) => item.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setDraft((value) => ({ ...value, [current.id]: ids }));
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="add-dialog sort-dialog" role="dialog" aria-modal="true" aria-labelledby="sort-dialog-title">
        <div className="add-dialog-head"><div><span>CONTENT ORDERING</span><h3 id="sort-dialog-title">内容排序</h3></div><button className="dialog-close" onClick={onClose} aria-label="关闭内容排序窗口"><X /></button></div>
        <div className="sort-dialog-body"><p className="sort-dialog-intro">拖动排序会同步到所有账号。新内容默认排在列表末尾，你可以随时重新调整。</p><div className="sort-tabs">{lists.map((list) => <button key={list.id} className={activeList === list.id ? 'is-active' : ''} onClick={() => setActiveList(list.id)}>{list.label}<b>{String(list.items.length).padStart(2, '0')}</b></button>)}</div><div className="sort-list">{orderedItems.map((item, index) => <div className="sort-row" key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.title}</strong><small>{item.category || item.phase || '内容'}</small></div><div className="sort-row-actions"><button onClick={() => move(index, -1)} disabled={index === 0} aria-label={`上移${item.title}`} title="上移"><MoveUp /></button><button onClick={() => move(index, 1)} disabled={index === orderedItems.length - 1} aria-label={`下移${item.title}`} title="下移"><MoveDown /></button></div></div>)}</div><div className="dialog-actions sort-actions"><button type="button" className="dialog-cancel" onClick={onClose}>取消</button><button type="button" className="dialog-submit" onClick={() => onSave(draft)} disabled={saving}>{saving ? <RefreshCw className="is-spinning" /> : <Save />} {saving ? '正在保存...' : '保存全部排序'}</button></div></div>
      </section>
    </div>
  );
}

function ReplayTypeTabs({ active, onChange, recordingCount, presentationReplayCount }) {
  return (
    <div className="replay-type-tabs" role="tablist" aria-label="会议回放类型">
      <button role="tab" aria-selected={active === 'video'} className={active === 'video' ? 'is-active' : ''} onClick={() => onChange('video')}><Video /> 视频回放 <b>{String(recordingCount).padStart(2, '0')}</b></button>
      <button role="tab" aria-selected={active === 'ppt'} className={active === 'ppt' ? 'is-active' : ''} onClick={() => onChange('ppt')}><Presentation /> PPT 回放 <b>{String(presentationReplayCount).padStart(2, '0')}</b></button>
    </div>
  );
}

function VideoReplayLibrary({ items, onAddClick, onRemove, canManage }) {
  return (
    <section className="video-replay-library" aria-label="视频回放列表">
      <div className="presentation-library-head video-library-head">
        <div><p className="section-kicker">TRAINING VIDEO REPLAY</p><h3>视频回放</h3></div>
        <div className="presentation-library-actions">
          <p>录入会议回放链接和培训主题信息，持续沉淀代理商训战内容。</p>
          {canManage && <button onClick={onAddClick}><Plus /> 添加视频</button>}
        </div>
      </div>
      <div className="recording-list">
        {items.length ? items.map((recording, index) => <RecordingRow key={recording.id} recording={recording} index={index} onRemove={onRemove} />) : <div className="no-results"><Search /><h3>没有找到相关视频回放</h3><p>换一个标题或日期试试。</p></div>}
      </div>
    </section>
  );
}

function ReplayPresentationLibrary({ items }) {
  return (
    <section className="presentation-library replay-ppt-library" aria-label="PPT 回放列表">
      <div className="presentation-library-head">
        <div><p className="section-kicker">TRAINING PRESENTATION REPLAY</p><h3>PPT 回放</h3></div>
        <div className="presentation-library-actions"><p>快速回顾开营、训战和代理商培训中的演示材料。</p></div>
      </div>
      {items.length ? (
        <div className="presentation-grid">
          {items.map((presentation, index) => <PresentationCard key={presentation.id} presentation={presentation} index={index} openLabel="打开回放" />)}
        </div>
      ) : <div className="no-results"><Search /><h3>没有找到相关 PPT 回放</h3><p>换一个课程名称试试。</p></div>}
    </section>
  );
}

function SolutionLibrary({ library, items, groups, onAddClick, onRemove, canManage }) {
  const config = LIBRARY_CONFIG[library];
  const indexedItems = items.map((presentation, index) => ({ presentation, index }));
  return (
    <section className={`presentation-library solution-library ${library}-library`} aria-label={`${config.label}列表`}>
      <div className="presentation-library-head">
        <div><p className="section-kicker">{config.kicker}</p><h3>{config.label}</h3></div>
        <div className="presentation-library-actions">
          <p>{config.description}</p>
          {canManage && <button onClick={onAddClick}><Plus /> 新增方案</button>}
        </div>
      </div>
      {items.length ? groups.map((group, groupIndex) => {
        const groupItems = indexedItems.filter(({ presentation }) => (presentation.group || 'solution') === group.id);
        if (!groupItems.length) return null;
        return (
          <section className="solution-group" key={group.id} aria-labelledby={`${library}-group-${group.id}`}>
            <div className="solution-group-head">
              <span>{String(groupIndex + 1).padStart(2, '0')}</span>
              <div><h4 id={`${library}-group-${group.id}`}>{group.label}</h4><p>{group.description}</p></div>
              <b>{String(groupItems.length).padStart(2, '0')}</b>
            </div>
            <div className="presentation-grid">
              {groupItems.map(({ presentation, index }) => <PresentationCard key={presentation.id} presentation={presentation} index={index} onRemove={onRemove} />)}
            </div>
          </section>
        );
      }) : <div className="no-results"><Search /><h3>{config.emptyTitle}</h3><p>{canManage ? config.emptyDescription : '超级管理员发布后，方案会自动同步到这里。'}</p>{canManage && <button className="empty-add-button" onClick={onAddClick}><Plus /> 新增方案</button>}</div>}
    </section>
  );
}

function Library({ presentationItems, presentationReplayItems, recordingItems, ecosystemVideoItems, groupsByLibrary, section, query, onSectionChange, onAddPresentationClick, onRemovePresentation, onAddRecordingClick, onRemoveRecording, onAddEcosystemVideo, onRemoveEcosystemVideo, onPlayEcosystemVideo, canManage, onPublishingSettings, onSortSettings }) {
  const [replayType, setReplayType] = useState('video');
  const normalized = query.trim().toLowerCase();
  const compactQuery = normalized.replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
  const filteredRecordings = useMemo(() => recordingItems.filter((item) => {
    const source = `${item.title} ${item.summary || ''} ${item.date} ${item.phase}`.toLowerCase();
    return source.includes(normalized) || source.replace(/[^a-z0-9\u4e00-\u9fff]/g, '').includes(compactQuery);
  }), [compactQuery, normalized, recordingItems]);
  const filteredPresentations = useMemo(() => presentationItems.filter((item) => {
    const library = item.library || 'intelligent';
    const groupLabel = groupsByLibrary[library]?.find((group) => group.id === item.group)?.label || item.groupLabel || '';
    const source = `${item.title} ${item.category || ''} ${groupLabel}`.toLowerCase();
    return source.includes(normalized) || source.replace(/[^a-z0-9\u4e00-\u9fff]/g, '').includes(compactQuery);
  }), [compactQuery, groupsByLibrary, normalized, presentationItems]);
  const filteredEcosystemVideos = useMemo(() => ecosystemVideoItems.filter((item) => {
    const source = `${item.title} ${item.summary || ''} ${item.category || ''}`.toLowerCase();
    return source.includes(normalized) || source.replace(/[^a-z0-9\u4e00-\u9fff]/g, '').includes(compactQuery);
  }), [compactQuery, ecosystemVideoItems, normalized]);
  const filteredPresentationReplays = useMemo(() => presentationReplayItems.filter((item) => {
    const source = `${item.title} ${item.category || ''} ${item.publishedAt || ''}`.toLowerCase();
    return source.includes(normalized) || source.replace(/[^a-z0-9\u4e00-\u9fff]/g, '').includes(compactQuery);
  }), [compactQuery, normalized, presentationReplayItems]);
  const filteredIntelligent = filteredPresentations.filter((item) => (item.library || 'intelligent') === 'intelligent');
  const filteredEcosystem = filteredPresentations.filter((item) => item.library === 'ecosystem');
  const showRecordings = section === 'all' || section === 'recordings';
  const showIntelligent = section === 'all' || section === 'presentations';
  const showEcosystem = section === 'all' || section === 'ecosystem';
  const showVideoReplay = section === 'all' || replayType === 'video';
  const showPptReplay = section === 'all' || replayType === 'ppt';
  const sectionTitle = section === 'presentations'
    ? LIBRARY_CONFIG.intelligent.label
    : section === 'ecosystem'
      ? LIBRARY_CONFIG.ecosystem.label
      : section === 'recordings'
        ? '代理商训战回放'
        : '最新学习资源';

  return (
    <section className="library" id="library">
      <div className="section-heading">
        <div><p className="section-kicker">LEARNING RESOURCE CENTER</p><h2>{sectionTitle}</h2><p className="heading-desc">回看训战内容，查阅智能方案与生态联合方案，把碎片经验沉淀为可复用的业务方法。</p></div>
        <div className="library-controls">
          {canManage && <button className="admin-sort-library-button" onClick={onSortSettings}><ListOrdered /> 内容排序</button>}
          {canManage && <button className="sync-device-button" onClick={onPublishingSettings}><CloudUpload /> 全账号共享</button>}
          <div className="segment-control" aria-label="内容类型筛选">
            {[['all', '全部'], ['recordings', '会议回放'], ['presentations', '智能方案讲解'], ['ecosystem', '生态解决方案']].map(([id, label]) => (
              <button key={id} className={section === id ? 'is-active' : ''} onClick={() => onSectionChange(id)}>{label}</button>
            ))}
          </div>
        </div>
      </div>
      {showRecordings && (
        <section className="replay-library" aria-label="会议回放资源">
          {section === 'recordings' && <ReplayTypeTabs active={replayType} onChange={setReplayType} recordingCount={recordingItems.length} presentationReplayCount={presentationReplayItems.length} />}
          {showVideoReplay && <VideoReplayLibrary items={filteredRecordings} onAddClick={onAddRecordingClick} onRemove={canManage ? onRemoveRecording : null} canManage={canManage} />}
          {showPptReplay && <ReplayPresentationLibrary items={filteredPresentationReplays} />}
        </section>
      )}
      {showIntelligent && <SolutionLibrary library="intelligent" items={filteredIntelligent} groups={groupsByLibrary.intelligent} onAddClick={() => onAddPresentationClick('intelligent')} onRemove={canManage ? onRemovePresentation : null} canManage={canManage} />}
      {showEcosystem && <SolutionLibrary library="ecosystem" items={filteredEcosystem} groups={groupsByLibrary.ecosystem} onAddClick={() => onAddPresentationClick('ecosystem')} onRemove={canManage ? onRemovePresentation : null} canManage={canManage} />}
      {showEcosystem && <EcosystemVideoLibrary items={filteredEcosystemVideos} onAddClick={onAddEcosystemVideo} onRemove={canManage ? onRemoveEcosystemVideo : null} canManage={canManage} onPlay={onPlayEcosystemVideo} />}
    </section>
  );
}

function Footer() {
  return (
    <footer><div className="footer-brand"><img src={LOGO_SRC} alt="智显机器人" /><span>AI训战中心</span></div><div><GraduationCap /><span>赋能每一位伙伴，更专业地理解产品、更高效地赢得客户。</span></div><a href="#top">返回顶部 <ArrowLeft /></a></footer>
  );
}

function LoadingScreen() {
  return (
    <main className="auth-loading" aria-live="polite">
      <img src={LOGO_SRC} alt="智显机器人" />
      <LoaderCircle aria-hidden="true" />
      <p>正在验证 ZBrain 账号...</p>
    </main>
  );
}

function LoginPage({ onAuthenticated, initialError = '', onRetry }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(initialError);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setInviteCode('');
    setShowPassword(false);
    setError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('请输入 ZBrain 用户名和密码。');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }
    const cleanInviteCode = inviteCode.trim();
    if (mode === 'register' && !cleanInviteCode) {
      setError('请输入邀请码。');
      return;
    }

    setPending(true);
    setError('');
    try {
      const user = mode === 'login'
        ? await login(cleanUsername, password)
        : await register(cleanUsername, password, cleanInviteCode);
      onAuthenticated(user || { username: cleanUsername });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '认证失败，请稍后重试。');
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="智显机器人代理商赋能体系">
        <div className="auth-story-grid" aria-hidden="true" />
        <div className="auth-story-brand"><img src={LOGO_SRC} alt="智显机器人" /><span>AI训战中心</span></div>
        <div className="auth-story-copy">
          <h1>让学习能力，<br />成为代理商的成交能力。</h1>
          <p>通过 ZBrain 统一账号进入产品学习、智能方案与会议回放，把知识快速转化为客户沟通和项目推进能力。</p>
        </div>
        <div className="auth-capability-list">
          <span><b>01</b><strong>理解产品</strong><small>讲清产品价值</small></span>
          <span><b>02</b><strong>匹配方案</strong><small>回应客户场景</small></span>
          <span><b>03</b><strong>推进成交</strong><small>形成业务结果</small></span>
        </div>
        <p className="auth-story-footer">ZBRAIN · PARTNER ENABLEMENT SYSTEM</p>
      </section>

      <section className="auth-form-panel">
        <div className={`auth-form-wrap ${mode === 'register' ? 'is-register' : ''}`}>
          <div className="auth-mobile-brand"><img src={LOGO_SRC} alt="智显机器人" /><span>AI训战中心</span></div>
          <div className="auth-heading">
            <span>{mode === 'login' ? 'WELCOME BACK' : 'CREATE ZBRAIN ACCOUNT'}</span>
            <h2>{mode === 'login' ? '登录 AI 训战中心' : '注册 ZBrain 账号'}</h2>
            <p>{mode === 'login' ? '使用你的 ZBrain 账号继续学习。' : '注册后将自动登录并进入学习中心。'}</p>
          </div>

          <div className="auth-tabs" role="tablist" aria-label="账号认证方式">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'is-active' : ''} onClick={() => changeMode('login')}>登录</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'is-active' : ''} onClick={() => changeMode('register')}>注册账号</button>
          </div>

          <form className="auth-form" onSubmit={submit} noValidate>
            <label>
              <span>用户名</span>
              <div className="auth-input"><UserRound aria-hidden="true" /><input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入 ZBrain 用户名" disabled={pending} autoFocus /></div>
            </label>
            <label>
              <span>密码</span>
              <div className="auth-input"><LockKeyhole aria-hidden="true" /><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" disabled={pending} /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? '隐藏密码' : '显示密码'}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
            </label>
            {mode === 'register' && (
              <>
                <label>
                  <span>确认密码</span>
                  <div className="auth-input"><LockKeyhole aria-hidden="true" /><input type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="请再次输入密码" disabled={pending} /></div>
                </label>
                <label>
                  <span className="invite-label">邀请码（请联系孙文雪：13591738060 程鹏：18518686565）</span>
                  <div className="auth-input"><KeyRound aria-hidden="true" /><input autoComplete="off" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="请输入邀请码" disabled={pending} /></div>
                </label>
              </>
            )}
            {error && <div className="auth-error" role="alert"><span>{error}</span>{initialError && onRetry && <button type="button" onClick={onRetry}>重新验证</button>}</div>}
            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="is-spinning" /> : mode === 'login' ? <LogIn /> : <UserPlus />}
              <span>{pending ? '正在连接 ZBrain...' : mode === 'login' ? '登录并进入学习中心' : '注册并进入学习中心'}</span>
              {!pending && <ArrowRight />}
            </button>
          </form>

          <div className="auth-trust"><BadgeCheck /><span>账号由 ZBrain 统一管理，训战中心不会保存你的密码。</span></div>
          <a className="auth-official-link" href="https://www.zbrain.cn" target="_blank" rel="noreferrer">访问智显机器人官网 <ArrowUpRight /></a>
        </div>
      </section>
    </main>
  );
}

function AppContent({ user, onLogout }) {
  const superAdmin = isSuperAdmin(user);
  const previewParams = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null;
  const previewSection = previewParams?.get('ui-section') || '';
  const initialSection = ['recordings', 'presentations', 'ecosystem'].includes(previewSection) ? previewSection : 'all';
  const [section, setSection] = useState(initialSection);
  const [activeNav, setActiveNav] = useState(initialSection === 'all' ? 'overview' : initialSection);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [addDialogLibrary, setAddDialogLibrary] = useState(null);
  const [addRecordingDialogOpen, setAddRecordingDialogOpen] = useState(false);
  const [addEcosystemVideoDialogOpen, setAddEcosystemVideoDialogOpen] = useState(false);
  const [playingEcosystemVideo, setPlayingEcosystemVideo] = useState(null);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [sortSaving, setSortSaving] = useState(false);
  const [publishingDialogOpen, setPublishingDialogOpen] = useState(superAdmin && previewParams?.get('ui-publishing') === '1');
  const [publishing, setPublishing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [customPresentations, setCustomPresentations] = useState(() => superAdmin ? loadCustomPresentations() : []);
  const [customRecordings, setCustomRecordings] = useState(() => superAdmin ? loadCustomRecordings() : []);
  const [ecosystemVideos, setEcosystemVideos] = useState(() => superAdmin ? loadCustomEcosystemVideos() : []);
  const [ordering, setOrdering] = useState({});
  const publishQueueRef = React.useRef(Promise.resolve());
  const pendingPublishesRef = React.useRef(0);
  const presentationBase = useMemo(() => [...presentations, ...customPresentations]
    .map((item, index) => ({ item, index, time: item.publishedAt ? Date.parse(item.publishedAt) : 0 }))
    .sort((left, right) => right.time - left.time || left.index - right.index)
    .map(({ item }) => item), [customPresentations]);
  const intelligentItems = useMemo(() => applyOrdering(presentationBase.filter((item) => (item.library || 'intelligent') === 'intelligent'), ordering.intelligentPresentations || ordering.presentations), [ordering.intelligentPresentations, ordering.presentations, presentationBase]);
  const ecosystemItems = useMemo(() => applyOrdering(presentationBase.filter((item) => item.library === 'ecosystem'), ordering.ecosystemPresentations || ordering.presentations), [ordering.ecosystemPresentations, ordering.presentations, presentationBase]);
  const presentationItems = useMemo(() => [...intelligentItems, ...ecosystemItems], [ecosystemItems, intelligentItems]);
  const groupsByLibrary = useMemo(() => ({
    intelligent: getLibraryGroups(presentationItems, 'intelligent'),
    ecosystem: getLibraryGroups(presentationItems, 'ecosystem'),
  }), [presentationItems]);
  const recordingBase = useMemo(() => [...recordings, ...customRecordings]
    .map((item, index) => ({ item, index, time: Date.parse(`${item.date}T${item.time || '00:00'}:00`) || 0 }))
    .sort((left, right) => right.time - left.time || left.index - right.index)
    .map(({ item }) => item), [customRecordings]);
  const recordingItems = useMemo(() => applyOrdering(recordingBase, ordering.recordings), [ordering.recordings, recordingBase]);
  const ecosystemVideoItems = useMemo(() => applyOrdering([...ecosystemVideos].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt))), ordering.ecosystemVideos), [ecosystemVideos, ordering.ecosystemVideos]);
  const orderedPresentationReplays = useMemo(() => applyOrdering(presentationReplays, ordering.presentationReplays), [ordering.presentationReplays]);
  const sortLists = useMemo(() => [
    { id: 'recordings', label: '会议视频', items: recordingItems },
    { id: 'presentationReplays', label: '会议 PPT', items: orderedPresentationReplays },
    { id: 'intelligentPresentations', label: '智能方案', items: intelligentItems },
    { id: 'ecosystemPresentations', label: '生态方案', items: ecosystemItems },
    { id: 'ecosystemVideos', label: '生态视频', items: ecosystemVideoItems },
  ], [ecosystemItems, ecosystemVideoItems, intelligentItems, orderedPresentationReplays, recordingItems]);

  React.useEffect(() => {
    if (superAdmin) localStorage.setItem(PRESENTATION_STORAGE_KEY, JSON.stringify(customPresentations));
  }, [customPresentations, superAdmin]);

  React.useEffect(() => {
    if (superAdmin) localStorage.setItem(RECORDING_STORAGE_KEY, JSON.stringify(customRecordings));
  }, [customRecordings, superAdmin]);

  React.useEffect(() => {
    if (superAdmin) localStorage.setItem(ECOSYSTEM_VIDEO_STORAGE_KEY, JSON.stringify(ecosystemVideos));
  }, [ecosystemVideos, superAdmin]);

  React.useEffect(() => {
    let cancelled = false;
    const refreshSharedContent = async () => {
      try {
        const shared = await loadSharedContent();
        if (cancelled) return;
        const sharedPresentations = normalizeSyncedPresentations(shared.presentations);
        const sharedRecordings = normalizeSyncedRecordings(shared.recordings);
        const sharedVideos = normalizeSyncedVideos(shared.ecosystemVideos);
        setOrdering(shared.ordering || {});
        if (superAdmin) {
          setCustomPresentations((current) => mergeSharedItems(current, sharedPresentations, 'presentation').items);
          setCustomRecordings((current) => mergeSharedItems(current, sharedRecordings, 'recording').items);
          setEcosystemVideos((current) => mergeSharedItems(current, sharedVideos, 'video').items);
        } else {
          setCustomPresentations(sharedPresentations);
          setCustomRecordings(sharedRecordings);
          setEcosystemVideos(sharedVideos);
        }
      } catch (error) {
        if (!cancelled) setSyncMessage(error instanceof Error ? error.message : '暂时无法读取全账号共享内容。');
      }
    };

    refreshSharedContent();
    if (superAdmin) return () => { cancelled = true; };
    const interval = window.setInterval(refreshSharedContent, 120000);
    window.addEventListener('focus', refreshSharedContent);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshSharedContent);
    };
  }, [superAdmin]);

  React.useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('.search-box input')?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const hashTarget = window.location.hash;
    if (/^#[A-Za-z][\w-]*$/.test(hashTarget)) requestAnimationFrame(() => document.querySelector(hashTarget)?.scrollIntoView());
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const browse = () => {
    setActiveNav('overview');
    document.querySelector('#enablement')?.scrollIntoView({ behavior: 'smooth' });
  };

  const changeSection = (nextSection) => {
    setSection(nextSection);
    setActiveNav(nextSection === 'all' ? 'overview' : nextSection);
  };

  const publishSnapshot = React.useCallback((nextPresentations, nextRecordings, nextVideos, nextOrdering, suppliedToken = getPublishingToken()) => {
    const token = suppliedToken.trim();
    if (!token) {
      setPublishingDialogOpen(true);
      setSyncMessage('内容已保存在本机。请先启用 GitHub 发布通道，再同步到所有账号。');
      return Promise.resolve(false);
    }

    pendingPublishesRef.current += 1;
    setPublishing(true);
    const task = publishQueueRef.current
      .catch(() => undefined)
      .then(() => publishSharedContent({
        version: 1,
        updatedAt: new Date().toISOString(),
        updatedBy: 'yinze1',
        presentations: normalizeSyncedPresentations(nextPresentations),
        recordings: normalizeSyncedRecordings(nextRecordings),
        ecosystemVideos: normalizeSyncedVideos(nextVideos),
        ordering: nextOrdering || {},
      }, token))
      .then(() => {
        setSyncMessage('内容已提交到 GitHub，所有平台账号将在页面发布完成后自动看到更新。');
        setPublishingDialogOpen(false);
        return true;
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '全账号共享发布失败。';
        if (message.includes('令牌') || message.includes('权限')) clearPublishingToken();
        setSyncMessage(message);
        setPublishingDialogOpen(true);
        return false;
      })
      .finally(() => {
        pendingPublishesRef.current -= 1;
        if (pendingPublishesRef.current === 0) setPublishing(false);
      });
    publishQueueRef.current = task;
    return task;
  }, []);

  const addPresentation = (item) => {
    const cover = COVER_ASSETS[Math.floor(Math.random() * COVER_ASSETS.length)];
    const nextItem = {
      ...item,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      cover,
      isCustom: true,
    };
    const nextPresentations = [...customPresentations, nextItem];
    const orderKey = item.library === 'ecosystem' ? 'ecosystemPresentations' : 'intelligentPresentations';
    const nextOrdering = { ...ordering, [orderKey]: [nextItem.id, ...(ordering[orderKey] || [])] };
    setCustomPresentations(nextPresentations);
    setOrdering(nextOrdering);
    void publishSnapshot(nextPresentations, customRecordings, ecosystemVideos, nextOrdering);
    setQuery('');
    changeSection(LIBRARY_CONFIG[item.library || 'intelligent'].section);
    setAddDialogLibrary(null);
    requestAnimationFrame(() => document.querySelector(`.${item.library || 'intelligent'}-library`)?.scrollIntoView({ behavior: 'smooth' }));
  };

  const removePresentation = (id) => {
    const nextPresentations = customPresentations.filter((presentation) => presentation.id !== id);
    const orderKey = customPresentations.find((item) => item.id === id)?.library === 'ecosystem' ? 'ecosystemPresentations' : 'intelligentPresentations';
    const nextOrdering = { ...ordering, [orderKey]: (ordering[orderKey] || []).filter((itemId) => itemId !== id) };
    setCustomPresentations(nextPresentations);
    setOrdering(nextOrdering);
    void publishSnapshot(nextPresentations, customRecordings, ecosystemVideos, nextOrdering);
  };

  const addRecording = (item) => {
    const nextItem = {
      ...item,
      id: `custom-recording-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      isCustom: true,
    };
    const nextRecordings = [...customRecordings, nextItem];
    const nextOrdering = { ...ordering, recordings: [nextItem.id, ...(ordering.recordings || [])] };
    setCustomRecordings(nextRecordings);
    setOrdering(nextOrdering);
    void publishSnapshot(customPresentations, nextRecordings, ecosystemVideos, nextOrdering);
    setQuery('');
    changeSection('recordings');
    setAddRecordingDialogOpen(false);
    requestAnimationFrame(() => document.querySelector('.video-replay-library')?.scrollIntoView({ behavior: 'smooth' }));
  };

  const removeRecording = (id) => {
    const nextRecordings = customRecordings.filter((recording) => recording.id !== id);
    const nextOrdering = { ...ordering, recordings: (ordering.recordings || []).filter((itemId) => itemId !== id) };
    setCustomRecordings(nextRecordings);
    setOrdering(nextOrdering);
    void publishSnapshot(customPresentations, nextRecordings, ecosystemVideos, nextOrdering);
  };

  const addEcosystemVideo = (item) => {
    const nextVideo = { ...item, id: `ecosystem-video-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, isCustom: true };
    const nextVideos = [...ecosystemVideos, nextVideo];
    const nextOrdering = { ...ordering, ecosystemVideos: [nextVideo.id, ...(ordering.ecosystemVideos || [])] };
    setEcosystemVideos(nextVideos);
    setOrdering(nextOrdering);
    void publishSnapshot(customPresentations, customRecordings, nextVideos, nextOrdering);
    setQuery('');
    changeSection('ecosystem');
    setAddEcosystemVideoDialogOpen(false);
    requestAnimationFrame(() => document.querySelector('.ecosystem-video-library')?.scrollIntoView({ behavior: 'smooth' }));
  };

  const removeEcosystemVideo = (id) => {
    const nextVideos = ecosystemVideos.filter((video) => video.id !== id);
    const nextOrdering = { ...ordering, ecosystemVideos: (ordering.ecosystemVideos || []).filter((itemId) => itemId !== id) };
    setEcosystemVideos(nextVideos);
    setOrdering(nextOrdering);
    void publishSnapshot(customPresentations, customRecordings, nextVideos, nextOrdering);
  };

  const saveOrdering = (nextOrdering) => {
    setOrdering(nextOrdering);
    setSortSaving(true);
    void publishSnapshot(customPresentations, customRecordings, ecosystemVideos, nextOrdering).finally(() => {
      setSortSaving(false);
      setSortDialogOpen(false);
    });
  };

  return (
    <div className="app-shell">
      <Sidebar solutionCount={intelligentItems.length} ecosystemCount={ecosystemItems.length + ecosystemVideoItems.length} replayCount={recordingItems.length + presentationReplays.length} section={section} onSectionChange={changeSection} activeNav={activeNav} onActiveNavChange={setActiveNav} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main>
        <Topbar query={query} setQuery={setQuery} onMenu={() => setMenuOpen(true)} user={user} onLogout={onLogout} superAdmin={superAdmin} onPublishingSettings={() => setPublishingDialogOpen(true)} onSortSettings={() => setSortDialogOpen(true)} />
        <Hero onBrowse={browse} onAbout={() => setActiveNav('overview')} />
        <div className="content-wrap"><Stats presentationCount={intelligentItems.length} recordingCount={recordingItems.length} /><About /></div>
        <Enablement />
        <div className="content-wrap"><Library presentationItems={presentationItems} presentationReplayItems={orderedPresentationReplays} recordingItems={recordingItems} ecosystemVideoItems={ecosystemVideoItems} groupsByLibrary={groupsByLibrary} section={section} query={query} onSectionChange={changeSection} onAddPresentationClick={setAddDialogLibrary} onRemovePresentation={removePresentation} onAddRecordingClick={() => setAddRecordingDialogOpen(true)} onRemoveRecording={removeRecording} onAddEcosystemVideo={() => setAddEcosystemVideoDialogOpen(true)} onRemoveEcosystemVideo={removeEcosystemVideo} onPlayEcosystemVideo={setPlayingEcosystemVideo} canManage={superAdmin} onPublishingSettings={() => setPublishingDialogOpen(true)} onSortSettings={() => setSortDialogOpen(true)} /><Footer /></div>
      </main>
      {superAdmin && <AddPresentationDialog key={addDialogLibrary || 'closed'} open={Boolean(addDialogLibrary)} defaultLibrary={addDialogLibrary || 'intelligent'} groupsByLibrary={groupsByLibrary} onClose={() => setAddDialogLibrary(null)} onAdd={addPresentation} />}
      {superAdmin && <AddRecordingDialog open={addRecordingDialogOpen} onClose={() => setAddRecordingDialogOpen(false)} onAdd={addRecording} />}
      {superAdmin && <AddEcosystemVideoDialog open={addEcosystemVideoDialogOpen} onClose={() => setAddEcosystemVideoDialogOpen(false)} onAdd={addEcosystemVideo} />}
      <VideoPlayerDialog video={playingEcosystemVideo} onClose={() => setPlayingEcosystemVideo(null)} />
      {superAdmin && <PublishingSettingsDialog open={publishingDialogOpen} presentationCount={customPresentations.length} recordingCount={customRecordings.length} ecosystemVideoCount={ecosystemVideos.length} onClose={() => setPublishingDialogOpen(false)} onTokenReady={(token) => { void publishSnapshot(customPresentations, customRecordings, ecosystemVideos, ordering, token); }} onPublish={(token) => { void publishSnapshot(customPresentations, customRecordings, ecosystemVideos, ordering, token); }} publishing={publishing} />}
      {superAdmin && <SortDialog open={sortDialogOpen} lists={sortLists} onClose={() => setSortDialogOpen(false)} onSave={saveOrdering} saving={sortSaving} />}
      {syncMessage && <div className="sync-toast" role="status"><BadgeCheck /><span>{syncMessage}</span><button onClick={() => setSyncMessage('')} aria-label="关闭同步提示"><X /></button></div>}
    </div>
  );
}

function App() {
  const previewUsername = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('ui-preview') : '';
  const [authState, setAuthState] = useState({ status: 'loading', user: null, error: '' });

  const verifySession = React.useCallback(() => {
    setAuthState((current) => ({ ...current, status: 'loading', error: '' }));
    getCurrentUser()
      .then((user) => setAuthState({ status: user ? 'authenticated' : 'anonymous', user, error: '' }))
      .catch((error) => setAuthState({ status: 'anonymous', user: null, error: error instanceof Error ? error.message : '暂时无法连接 ZBrain 认证服务。' }));
  }, []);

  React.useEffect(() => {
    if (previewUsername) return;
    verifySession();
  }, [previewUsername, verifySession]);

  const signOut = async () => {
    await logout();
    setAuthState({ status: 'anonymous', user: null, error: '' });
  };

  if (previewUsername) return <AppContent user={{ username: previewUsername, display_name: previewUsername }} onLogout={() => undefined} />;
  if (authState.status === 'loading') return <LoadingScreen />;
  if (!authState.user) return <LoginPage initialError={authState.error} onRetry={verifySession} onAuthenticated={(user) => setAuthState({ status: 'authenticated', user, error: '' })} />;
  return <AppContent user={authState.user} onLogout={signOut} />;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
