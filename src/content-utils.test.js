import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOrdering, isDirectMediaUrl, normalizeSyncedVideos } from './content-utils.js';
import { presentations, presentationReplays, recordings } from './data.js';

test('new training recordings retain their dates, links, phases and topic overviews', () => {
  const expected = [
    ['2026-08-15', '13:47', '第 7 期', '营销与销售助手实操及产品沟通', 'https://meeting.tencent.com/crm/l6Vv0k3o49', '营销助手实操'],
    ['2026-08-22', '13:44', '第 9 期', 'AI战略、解决方案助手与一笔控全场', 'https://meeting.tencent.com/crm/2kboMZJ4f6', 'AI通知课与战略发展'],
    ['2026-08-29', '13:46', '第 10 期', '产品架构、客户沟通与本地化部署', 'https://meeting.tencent.com/crm/2VpEX7Yxb6', '产品架构与本地化部署能力提升'],
    ['2026-09-04', '13:44', '第 11 期', '私有化智能体、牛黄智脑与会议室AI', 'https://meeting.tencent.com/crm/2O8RD4Z9a2', '私有化模型智能体与会议室AI应用'],
    ['2026-09-11', '13:48', '第 12 期', '展厅指挥中心联动与销售助手升级', 'https://meeting.tencent.com/crm/KE6YLa6Ld9', '展厅指挥中心联动与销售助手能力升级'],
    ['2026-09-18', '13:49', '第 13 期', '智能空间部署与展厅1.0演示', 'https://meeting.tencent.com/crm/2qy0L0gm92', '智能空间部署与展厅1.0平台应用'],
  ];
  for (const [date, time, phase, title, url, overview] of expected) {
    const matches = recordings.filter((item) => item.date === date);
    assert.equal(matches.length, 1, `expected one video for ${date}`);
    assert.equal(matches[0].time, time);
    assert.equal(matches[0].phase, phase);
    assert.equal(matches[0].title, title);
    assert.equal(matches[0].url, url);
    assert.ok(matches[0].summary.includes(overview));
  }
  assert.equal(new Set(recordings.map((item) => item.url)).size, recordings.length);
});

test('new training presentations appear once with their exact titles and links', () => {
  const expected = [
    ['智能空间部署链路详解', 'https://livepad.zbrain.cn/s/pad-muampqph-d7ltlu?p=p_ad1c531970069223'],
    ['一笔控全场-展厅多屏控制与智能讲解方案', 'https://livepad.zbrain.cn/s/pad-muaj97y8-4eyo28?p=p_ad1c531970069223'],
    ['AI解决方案营销助手', 'https://livepad.zbrain.cn/s/pad-mua11kck-o5uemy?p=p_ad1c531970069223'],
  ];
  assert.equal(presentationReplays.length, 7);
  for (const [title, url] of expected) {
    const matches = presentationReplays.filter((item) => item.url === url);
    assert.equal(matches.length, 1, `expected one PPT for ${url}`);
    assert.equal(matches[0].title, title);
    assert.equal(matches[0].category, '训战课程');
    assert.equal(matches[0].publishedAt, '2026-09-22');
  }
  assert.deepEqual(presentationReplays.slice(0, 3).map((item) => item.title), expected.map(([title]) => title));
});

test('removes the business report from the intelligent solution catalog', () => {
  assert.equal(presentations.some((item) => item.title === '智显机器人业务汇报'), false);
});

test('removes the six requested plans while keeping the rest of the catalog', () => {
  const removedTitles = [
    '国家电投内蒙古能源公司指挥中心数字人系统方案',
    '扬州文化传播智脑',
    'AI牛黄智脑分享',
    'LivePad在教育行业的应用',
    '能源行业AI智能应用体系建设方案',
    '展厅多屏统一联动方案·云边端协同架构',
  ];
  assert.equal(removedTitles.some((title) => presentations.some((item) => item.title === title)), false);
});

test('normalizes shared ecosystem videos and rejects invalid URLs', () => {
  const videos = normalizeSyncedVideos([
    { id: 'v-1', title: '生态视频', url: 'https://cdn.example.com/ecosystem.mp4', category: '生态伙伴', summary: '简介' },
    { title: '无效链接', url: 'javascript:alert(1)' },
  ]);

  assert.equal(videos.length, 1);
  assert.deepEqual(videos[0], {
    id: 'v-1',
    title: '生态视频',
    url: 'https://cdn.example.com/ecosystem.mp4',
    category: '生态伙伴',
    summary: '简介',
    cover: 'assets/covers/partner-training.png',
    createdAt: '',
    isCustom: true,
  });
});

test('recognizes direct media URLs without treating webpage links as media', () => {
  assert.equal(isDirectMediaUrl('https://cdn.example.com/video.mp4'), true);
  assert.equal(isDirectMediaUrl('https://cdn.example.com/video.m3u8?token=abc'), true);
  assert.equal(isDirectMediaUrl('https://meeting.tencent.com/crm/abc123'), false);
});

test('applies saved ordering and appends newly added items', () => {
  const items = [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }, { id: 'c', title: 'C' }];
  assert.deepEqual(applyOrdering(items, ['c', 'a']).map((item) => item.id), ['c', 'a', 'b']);
});
