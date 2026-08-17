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
  FileText,
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
  Menu,
  MessageSquareText,
  Play,
  Plus,
  Presentation,
  Search,
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
import './styles.css';

const LOGO_SRC = `${import.meta.env.BASE_URL}assets/zhixian-robot-logo.png`;
const COVER_ASSETS = [
  'assets/covers/ai-showroom.png',
  'assets/covers/digital-media-education.png',
  'assets/covers/partner-training.png',
];
const PRESENTATION_STORAGE_KEY = 'zbrainlearning-custom-presentations-v1';
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);
const SOLUTION_GROUPS = [
  { id: 'company', number: '01', label: '公司介绍', description: '了解智显机器人与合作伙伴的业务能力、品牌定位与核心优势。' },
  { id: 'solution', number: '02', label: '解决方案介绍', description: '按展厅、教育、能源与 AIGC 等场景查找可直接讲解的方案。' },
  { id: 'case', number: '03', label: '案例介绍', description: '通过已落地的展厅、能源与文旅案例，辅助客户沟通与项目转化。' },
];

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

function loadCustomPresentations() {
  try {
    const value = JSON.parse(localStorage.getItem(PRESENTATION_STORAGE_KEY) || '[]');
    return Array.isArray(value)
      ? value.filter((item) => item?.id && item?.title && item?.url).map((item) => ({ ...item, group: item.group || 'solution' }))
      : [];
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

function Sidebar({ solutionCount, replayCount, section, onSectionChange, activeNav, onActiveNavChange, open, onClose }) {
  const items = [
    { id: 'overview', label: '首页', icon: FolderOpen, href: '#top' },
    { id: 'presentations', label: '智能方案讲解', icon: FileText, href: '#library', count: solutionCount },
    { id: 'recordings', label: '会议回放', icon: Video, href: '#library', count: replayCount },
  ];

  const navigate = (item) => {
    if (item.id === 'recordings' || item.id === 'presentations') onSectionChange(item.id);
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

function Topbar({ query, setQuery, onMenu, user, onLogout }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onMenu} aria-label="打开导航"><Menu /></button>
      <div className="search-box">
        <Search aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索视频、PPT 回放或智能方案..."
          aria-label="搜索视频、PPT 回放或智能方案"
        />
        <kbd>⌘ K</kbd>
      </div>
      <div className="account-actions">
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

function Stats({ presentationCount }) {
  const stats = [
    { value: recordings.length, label: '场实战会议回放', icon: Video, detail: '覆盖 6 期连续训练' },
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

function RecordingRow({ recording, index }) {
  const date = new Date(`${recording.date}T12:00:00`);
  return (
    <article className={`recording-row ${recording.featured ? 'is-featured' : ''}`}>
      <div className="row-index">{String(index + 1).padStart(2, '0')}</div>
      <div className="row-line"><span /></div>
      <div className="row-date"><strong>{dateFormatter.format(date).replace('星期', '周')}</strong><span>{recording.date}</span></div>
      <div className="row-content">
        <div className="type-label"><Video /> {recording.phase.replaceAll(' ', '')} · 代理商训战回放</div>
        <h3>{recording.title}</h3>
        <p className="recording-summary">{recording.summary}</p>
        <p className="recording-time"><Clock3 /> {recording.time} 开始</p>
      </div>
      <a className="play-button" href={recording.url} target="_blank" rel="noreferrer"><Play fill="currentColor" /><span>观看回放</span><ArrowUpRight /></a>
    </article>
  );
}

function EmptyPpt() {
  return (
    <section className="ppt-empty">
      <div className="ppt-stack" aria-hidden="true"><span /><span /><span><FileText /></span></div>
      <div><p className="section-kicker">SALES SOLUTION LIBRARY</p><h2>销售方案资料正在整理中</h2><p>后续录入约 15 份产品与行业 PPT 后，这里将按产品认知、场景方案、客户演示和销售推进等主题归档，帮助代理商随时找到适合当前业务阶段的材料。</p></div>
    </section>
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

function AddPresentationDialog({ open, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [group, setGroup] = useState('solution');
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState(CURRENT_MONTH);
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
    if (!cleanedTitle || !cleanedUrl) {
      setError('请填写方案名称和网址。');
      return;
    }
    try {
      const parsedUrl = new URL(cleanedUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('invalid protocol');
      onAdd({ title: cleanedTitle, url: parsedUrl.href, group, category: category.trim() || '自定义方案', publishedAt: month ? `${month}-01` : '' });
      setTitle('');
      setUrl('');
      setGroup('solution');
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
          <div><span>ADD NEW SOLUTION</span><h3 id="add-presentation-title">新增智能方案</h3></div>
          <button className="dialog-close" onClick={onClose} aria-label="关闭新增方案窗口"><X /></button>
        </div>
        <form onSubmit={submit} noValidate>
          <label>
            <span>方案名称</span>
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="输入智能方案名称" />
          </label>
          <label>
            <span>方案网址</span>
            <div className="url-input"><Link2 /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" inputMode="url" /></div>
          </label>
          <label>
            <span>一级分类</span>
            <select value={group} onChange={(event) => setGroup(event.target.value)}>
              {SOLUTION_GROUPS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
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
            <button type="submit" className="dialog-submit"><Plus /> 添加到智能方案</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function ReplayTypeTabs({ active, onChange }) {
  return (
    <div className="replay-type-tabs" role="tablist" aria-label="会议回放类型">
      <button role="tab" aria-selected={active === 'video'} className={active === 'video' ? 'is-active' : ''} onClick={() => onChange('video')}><Video /> 视频回放 <b>{String(recordings.length).padStart(2, '0')}</b></button>
      <button role="tab" aria-selected={active === 'ppt'} className={active === 'ppt' ? 'is-active' : ''} onClick={() => onChange('ppt')}><Presentation /> PPT 回放 <b>{String(presentationReplays.length).padStart(2, '0')}</b></button>
    </div>
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

function SolutionLibrary({ items, onAddClick, onRemove }) {
  const indexedItems = items.map((presentation, index) => ({ presentation, index }));
  return (
    <section className="presentation-library solution-library" aria-label="智能方案讲解列表">
      <div className="presentation-library-head">
        <div><p className="section-kicker">INTELLIGENT SOLUTION LIBRARY</p><h3>智能方案讲解</h3></div>
        <div className="presentation-library-actions">
          <p>按公司、解决方案和案例归档，快速匹配不同客户的沟通场景。</p>
          <button onClick={onAddClick}><Plus /> 新增方案</button>
        </div>
      </div>
      {items.length ? SOLUTION_GROUPS.map((group) => {
        const groupItems = indexedItems.filter(({ presentation }) => (presentation.group || 'solution') === group.id);
        if (!groupItems.length) return null;
        return (
          <section className="solution-group" key={group.id} aria-labelledby={`solution-group-${group.id}`}>
            <div className="solution-group-head">
              <span>{group.number}</span>
              <div><h4 id={`solution-group-${group.id}`}>{group.label}</h4><p>{group.description}</p></div>
              <b>{String(groupItems.length).padStart(2, '0')}</b>
            </div>
            <div className="presentation-grid">
              {groupItems.map(({ presentation, index }) => <PresentationCard key={presentation.id} presentation={presentation} index={index} onRemove={onRemove} />)}
            </div>
          </section>
        );
      }) : <div className="no-results"><Search /><h3>没有找到相关智能方案</h3><p>换一个公司、行业或案例名称试试。</p></div>}
    </section>
  );
}

function Library({ presentationItems, section, query, onSectionChange, onAddClick, onRemove }) {
  const [replayType, setReplayType] = useState('video');
  const normalized = query.trim().toLowerCase();
  const compactQuery = normalized.replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
  const filteredRecordings = useMemo(() => recordings.filter((item) => {
    const source = `${item.title} ${item.summary || ''} ${item.date} ${item.phase}`.toLowerCase();
    return source.includes(normalized) || source.replace(/[^a-z0-9\u4e00-\u9fff]/g, '').includes(compactQuery);
  }), [compactQuery, normalized]);
  const filteredPresentations = useMemo(() => presentationItems.filter((item) => {
    const groupLabel = SOLUTION_GROUPS.find((group) => group.id === item.group)?.label || '';
    const source = `${item.title} ${item.category || ''} ${groupLabel}`.toLowerCase();
    return source.includes(normalized) || source.replace(/[^a-z0-9\u4e00-\u9fff]/g, '').includes(compactQuery);
  }), [compactQuery, normalized, presentationItems]);
  const filteredPresentationReplays = useMemo(() => presentationReplays.filter((item) => {
    const source = `${item.title} ${item.category || ''} ${item.publishedAt || ''}`.toLowerCase();
    return source.includes(normalized) || source.replace(/[^a-z0-9\u4e00-\u9fff]/g, '').includes(compactQuery);
  }), [compactQuery, normalized]);
  const showRecordings = section !== 'presentations';
  const showPresentations = section !== 'recordings';
  const showVideoReplay = section === 'all' || replayType === 'video';
  const showPptReplay = section === 'all' || replayType === 'ppt';

  return (
    <section className="library" id="library">
      <div className="section-heading">
        <div><p className="section-kicker">LEARNING RESOURCE CENTER</p><h2>{section === 'presentations' ? '智能方案讲解' : section === 'recordings' ? '代理商训战回放' : '最新学习资源'}</h2><p className="heading-desc">回看视频与培训 PPT，查阅分类智能方案，把碎片经验沉淀为可复用的业务方法。</p></div>
        <div className="segment-control" aria-label="内容类型筛选">
          {[['all', '全部'], ['recordings', '会议回放'], ['presentations', '智能方案讲解']].map(([id, label]) => (
            <button key={id} className={section === id ? 'is-active' : ''} onClick={() => onSectionChange(id)}>{label}</button>
          ))}
        </div>
      </div>
      {showRecordings && (
        <section className="replay-library" aria-label="会议回放资源">
          {section === 'recordings' && <ReplayTypeTabs active={replayType} onChange={setReplayType} />}
          {showVideoReplay && <div className="recording-list">{filteredRecordings.length ? filteredRecordings.map((recording, index) => <RecordingRow key={recording.id} recording={recording} index={index} />) : <div className="no-results"><Search /><h3>没有找到相关视频回放</h3><p>换一个标题或日期试试。</p></div>}</div>}
          {showPptReplay && <ReplayPresentationLibrary items={filteredPresentationReplays} />}
        </section>
      )}
      {showPresentations && (presentationItems.length ? <SolutionLibrary items={filteredPresentations} onAddClick={onAddClick} onRemove={onRemove} /> : <EmptyPpt />)}
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
                  <span>邀请码</span>
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
  const [section, setSection] = useState('all');
  const [activeNav, setActiveNav] = useState('overview');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [customPresentations, setCustomPresentations] = useState(loadCustomPresentations);
  const presentationItems = useMemo(() => [...presentations, ...customPresentations]
    .map((item, index) => ({ item, index, time: item.publishedAt ? Date.parse(item.publishedAt) : 0 }))
    .sort((left, right) => right.time - left.time || left.index - right.index)
    .map(({ item }) => item), [customPresentations]);

  React.useEffect(() => {
    localStorage.setItem(PRESENTATION_STORAGE_KEY, JSON.stringify(customPresentations));
  }, [customPresentations]);

  React.useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('.search-box input')?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const hashTarget = window.location.hash;
    if (hashTarget) requestAnimationFrame(() => document.querySelector(hashTarget)?.scrollIntoView());
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

  const addPresentation = (item) => {
    const cover = COVER_ASSETS[Math.floor(Math.random() * COVER_ASSETS.length)];
    setCustomPresentations((current) => [...current, {
      ...item,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      cover,
      isCustom: true,
    }]);
    setQuery('');
    changeSection('presentations');
    setAddDialogOpen(false);
    requestAnimationFrame(() => document.querySelector('.presentation-library')?.scrollIntoView({ behavior: 'smooth' }));
  };

  const removePresentation = (id) => {
    setCustomPresentations((current) => current.filter((presentation) => presentation.id !== id));
  };

  return (
    <div className="app-shell">
      <Sidebar solutionCount={presentationItems.length} replayCount={recordings.length + presentationReplays.length} section={section} onSectionChange={changeSection} activeNav={activeNav} onActiveNavChange={setActiveNav} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main>
        <Topbar query={query} setQuery={setQuery} onMenu={() => setMenuOpen(true)} user={user} onLogout={onLogout} />
        <Hero onBrowse={browse} onAbout={() => setActiveNav('overview')} />
        <div className="content-wrap"><Stats presentationCount={presentationItems.length} /><About /></div>
        <Enablement />
        <div className="content-wrap"><Library presentationItems={presentationItems} section={section} query={query} onSectionChange={changeSection} onAddClick={() => setAddDialogOpen(true)} onRemove={removePresentation} /><Footer /></div>
      </main>
      <AddPresentationDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onAdd={addPresentation} />
    </div>
  );
}

function App() {
  const [authState, setAuthState] = useState({ status: 'loading', user: null, error: '' });

  const verifySession = React.useCallback(() => {
    setAuthState((current) => ({ ...current, status: 'loading', error: '' }));
    getCurrentUser()
      .then((user) => setAuthState({ status: user ? 'authenticated' : 'anonymous', user, error: '' }))
      .catch((error) => setAuthState({ status: 'anonymous', user: null, error: error instanceof Error ? error.message : '暂时无法连接 ZBrain 认证服务。' }));
  }, []);

  React.useEffect(() => {
    verifySession();
  }, [verifySession]);

  const signOut = async () => {
    await logout();
    setAuthState({ status: 'anonymous', user: null, error: '' });
  };

  if (authState.status === 'loading') return <LoadingScreen />;
  if (!authState.user) return <LoginPage initialError={authState.error} onRetry={verifySession} onAuthenticated={(user) => setAuthState({ status: 'authenticated', user, error: '' })} />;
  return <AppContent user={authState.user} onLogout={signOut} />;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
