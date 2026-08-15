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
  Link2,
  Menu,
  MessageSquareText,
  Play,
  Plus,
  Presentation,
  Search,
  Sparkles,
  Target,
  Trash2,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { presentations, recordings } from './data';
import './styles.css';

const LOGO_SRC = `${import.meta.env.BASE_URL}assets/zhixian-robot-logo.png`;
const COVER_ASSETS = [
  'assets/covers/ai-showroom.png',
  'assets/covers/digital-media-education.png',
  'assets/covers/partner-training.png',
];
const PRESENTATION_STORAGE_KEY = 'zbrainlearning-custom-presentations-v1';
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

function loadCustomPresentations() {
  try {
    const value = JSON.parse(localStorage.getItem(PRESENTATION_STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item) => item?.id && item?.title && item?.url) : [];
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

function Sidebar({ presentationCount, section, onSectionChange, activeNav, onActiveNavChange, open, onClose }) {
  const items = [
    { id: 'overview', label: '首页', icon: FolderOpen, href: '#top' },
    { id: 'presentations', label: 'PPT 方案', icon: FileText, href: '#library', count: presentationCount },
    { id: 'recordings', label: '会议回放', icon: Video, href: '#library', count: recordings.length },
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

function Topbar({ query, setQuery, onMenu }) {
  return (
    <header className="topbar">
      <button className="icon-button mobile-only" onClick={onMenu} aria-label="打开导航"><Menu /></button>
      <div className="search-box">
        <Search aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索课程、日期或方案资料..."
          aria-label="搜索课程、日期或方案资料"
        />
        <kbd>⌘ K</kbd>
      </div>
      <a className="top-link" href="#library">进入资源中心 <ArrowUpRight aria-hidden="true" /></a>
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
    { value: presentationCount || '待', label: '份产品方案资料', icon: FileText, detail: '方案库持续补充中' },
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
      <div className="row-content"><div className="type-label"><Video /> 代理商训战回放</div><h3>{recording.title}</h3><p><Clock3 /> {recording.time} 开始 <span>·</span> {recording.phase}</p></div>
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

function PresentationCard({ presentation, index, onRemove }) {
  const cover = presentation.cover || COVER_ASSETS[index % COVER_ASSETS.length];
  const monthLabel = presentation.publishedAt?.slice(0, 7).replace('-', '.');
  return (
    <article className="presentation-card">
      <div className="presentation-card-head">
        <span className="presentation-index">{String(index + 1).padStart(2, '0')}{monthLabel && <small>{monthLabel}</small>}</span>
        <div className="presentation-card-meta">
          <span className="presentation-category"><Presentation /> {presentation.category || '产品方案'}</span>
          {presentation.isCustom && (
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
        <span>打开方案</span><ArrowUpRight />
      </a>
    </article>
  );
}

function AddPresentationDialog({ open, onClose, onAdd }) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
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
      onAdd({ title: cleanedTitle, url: parsedUrl.href, category: category.trim() || '自定义方案', publishedAt: month ? `${month}-01` : '' });
      setTitle('');
      setUrl('');
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
          <div><span>ADD NEW SOLUTION</span><h3 id="add-presentation-title">新增 PPT 方案</h3></div>
          <button className="dialog-close" onClick={onClose} aria-label="关闭新增方案窗口"><X /></button>
        </div>
        <form onSubmit={submit} noValidate>
          <label>
            <span>方案名称</span>
            <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="输入 PPT 方案名称" />
          </label>
          <label>
            <span>方案网址</span>
            <div className="url-input"><Link2 /><input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://" inputMode="url" /></div>
          </label>
          <label>
            <span>方案分类 <small>选填</small></span>
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="例如：行业方案、代理商培训" />
          </label>
          <label>
            <span>方案月份 <small>用于倒序排列</small></span>
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button type="button" className="dialog-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="dialog-submit"><Plus /> 添加到方案库</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PresentationLibrary({ items, onAddClick, onRemove }) {
  if (!items.length) return <div className="no-results"><Search /><h3>没有找到相关方案</h3><p>换一个方案名称试试。</p></div>;
  return (
    <section className="presentation-library" aria-label="PPT 方案列表">
      <div className="presentation-library-head">
        <div><p className="section-kicker">PRESENTATION LIBRARY</p><h3>PPT 方案</h3></div>
        <div className="presentation-library-actions">
          <p>点击方案名称或“打开方案”，即可在新标签页查看完整内容。</p>
          <button onClick={onAddClick}><Plus /> 新增方案</button>
        </div>
      </div>
      <div className="presentation-grid">
        {items.map((presentation, index) => <PresentationCard key={presentation.id} presentation={presentation} index={index} onRemove={onRemove} />)}
      </div>
    </section>
  );
}

function Library({ presentationItems, section, query, onSectionChange, onAddClick, onRemove }) {
  const normalized = query.trim().toLowerCase();
  const compactQuery = normalized.replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
  const filteredRecordings = useMemo(() => recordings.filter((item) => {
    const source = `${item.title} ${item.date} ${item.phase}`.toLowerCase();
    return source.includes(normalized) || source.replace(/[^a-z0-9\u4e00-\u9fff]/g, '').includes(compactQuery);
  }), [compactQuery, normalized]);
  const filteredPresentations = useMemo(() => presentationItems.filter((item) => {
    const source = `${item.title} ${item.category || ''}`.toLowerCase();
    return source.includes(normalized) || source.replace(/[^a-z0-9\u4e00-\u9fff]/g, '').includes(compactQuery);
  }), [compactQuery, normalized, presentationItems]);
  const showRecordings = section !== 'presentations';
  const showPresentations = section !== 'recordings';

  return (
    <section className="library" id="library">
      <div className="section-heading">
        <div><p className="section-kicker">LEARNING RESOURCE CENTER</p><h2>{section === 'presentations' ? '销售方案库' : section === 'recordings' ? '代理商训战回放' : '最新学习资源'}</h2><p className="heading-desc">回看实战训练，查阅产品方案，把碎片经验沉淀为可复用的业务方法。</p></div>
        <div className="segment-control" aria-label="内容类型筛选">
          {[['all', '全部'], ['recordings', '会议回放'], ['presentations', 'PPT 方案']].map(([id, label]) => (
            <button key={id} className={section === id ? 'is-active' : ''} onClick={() => onSectionChange(id)}>{label}</button>
          ))}
        </div>
      </div>
      {showRecordings && <div className="recording-list">{filteredRecordings.length ? filteredRecordings.map((recording, index) => <RecordingRow key={recording.id} recording={recording} index={index} />) : <div className="no-results"><Search /><h3>没有找到相关课程</h3><p>换一个标题或日期试试。</p></div>}</div>}
      {showPresentations && (presentationItems.length ? <PresentationLibrary items={filteredPresentations} onAddClick={onAddClick} onRemove={onRemove} /> : <EmptyPpt />)}
    </section>
  );
}

function Footer() {
  return (
    <footer><div className="footer-brand"><img src={LOGO_SRC} alt="智显机器人" /><span>AI训战中心</span></div><div><GraduationCap /><span>赋能每一位伙伴，更专业地理解产品、更高效地赢得客户。</span></div><a href="#top">返回顶部 <ArrowLeft /></a></footer>
  );
}

function App() {
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
      <Sidebar presentationCount={presentationItems.length} section={section} onSectionChange={changeSection} activeNav={activeNav} onActiveNavChange={setActiveNav} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main>
        <Topbar query={query} setQuery={setQuery} onMenu={() => setMenuOpen(true)} />
        <Hero onBrowse={browse} onAbout={() => setActiveNav('overview')} />
        <div className="content-wrap"><Stats presentationCount={presentationItems.length} /><About /></div>
        <Enablement />
        <div className="content-wrap"><Library presentationItems={presentationItems} section={section} query={query} onSectionChange={changeSection} onAddClick={() => setAddDialogOpen(true)} onRemove={removePresentation} /><Footer /></div>
      </main>
      <AddPresentationDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onAdd={addPresentation} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
