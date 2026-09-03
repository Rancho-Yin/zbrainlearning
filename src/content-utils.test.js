import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOrdering, isDirectMediaUrl, normalizeSyncedVideos } from './content-utils.js';
import { presentations } from './data.js';

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
