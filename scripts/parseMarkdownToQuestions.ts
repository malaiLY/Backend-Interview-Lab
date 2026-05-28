/**
 * parseMarkdownToQuestions.ts
 *
 * 读取 docs/ 目录下的 Markdown 面试题文件，输出符合 Question 类型的 questions.json。
 *
 * 支持的标题格式：
 *   1) ### N. Title (高)       — JavaSE / JVM / MySQL 等
 *   2) #### N. Title（中）     — Redis / Spring / MQ 等
 *   3) **Title（高）**         — JUC (加粗文本)
 *   4) ### Title               — 计网 (无难度标记)
 *
 * 用法：pnpm parse:questions
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== 配置 ====================

const DOCS_DIR = path.resolve(__dirname, '../docs');
const OUTPUT_FILE = path.resolve(__dirname, '../src/data/questions.json');

type Module = 'JavaSE' | 'JUC' | 'JVM' | 'Spring' | 'MySQL' | 'Redis' | 'MQ' | 'Network';

/** 文件名 → 模块 */
const FILE_MODULE_MAP: Record<string, Module> = {
  'JavaSE':       'JavaSE',
  'JUC':          'JUC',
  'JVM':          'JVM',
  'Spring全家桶': 'Spring',
  'MySQL':        'MySQL',
  'Redis':        'Redis',
  'MQ':           'MQ',
  '计网':         'Network',
};

// ==================== 关键词 → 标签 ====================

const TAG_RULES: [RegExp, string[], Module[]?][] = [
  [/HashMap|ConcurrentHashMap/, ['集合', 'HashMap']],
  [/synchronized/,              ['并发', '锁']],
  [/ReentrantLock|Lock/,        ['并发', '锁']],
  [/volatile/,                  ['JMM', '并发']],
  [/CAS|Atomic/,                ['CAS', '并发']],
  [/线程池|ThreadPool/,         ['线程池']],
  [/ThreadLocal/,               ['并发', 'ThreadLocal']],
  [/CountDownLatch|CyclicBarrier|Semaphore/, ['并发工具']],
  [/AOP|切面/,                  ['AOP']],
  [/IoC|IOC|BeanFactory|控制反转/, ['IoC']],
  [/事务|@Transactional/,       ['事务']],
  [/代理|Proxy|CGLIB/,          ['代理', 'AOP']],
  [/SpringBoot|自动装配|Starter/, ['SpringBoot']],
  [/MVCC/,                      ['MVCC', '事务']],
  [/索引|B\+树|Index/,          ['索引']],
  [/隔离级别|隔离性/,            ['事务', '隔离级别'], ['MySQL']],
  [/Redis/,                     ['Redis']],
  [/缓存|Cache/,                ['缓存']],
  [/穿透|击穿|雪崩/,            ['缓存']],
  [/分布式锁/,                   ['分布式锁']],
  [/持久化|RDB|AOF/,            ['持久化']],
  [/跳表|SkipList|ZSet/,        ['数据结构']],
  [/消息队列|MQ|Kafka|RabbitMQ|RocketMQ/, ['消息队列']],
  [/TCP|握手|挥手/,             ['TCP']],
  [/UDP/,                       ['UDP']],
  [/HTTP|HTTPS/,                ['HTTP']],
  [/DNS/,                       ['DNS']],
  [/JVM|虚拟机/,                ['JVM']],
  [/GC|垃圾回收|垃圾收集/,       ['GC']],
  [/类加载|ClassLoader/,        ['类加载']],
  [/内存|堆|栈/,                ['内存']],
  [/异常|Exception|OOM/,        ['异常']],
  [/集合|List|Set|Map/,         ['集合']],
  [/String|StringBuilder/,      ['String']],
  [/反射|Reflect/,              ['反射']],
  [/泛型|Generic/,              ['泛型']],
  [/Stream|Lambda/,             ['Stream']],
  [/设计模式|单例|工厂|策略/,    ['设计模式']],
  [/查询优化|慢查询|SQL\s*(优化|执行|语句|索引)/, ['SQL优化'], ['MySQL']],
  [/锁|Lock|死锁/,              ['锁']],
];

function extractTags(title: string, answer: string, module: Module): string[] {
  const text = title + ' ' + answer;
  const tags = new Set<string>();
  tags.add(module);
  for (const [re, tagList, allowedModules] of TAG_RULES) {
    if (allowedModules && !allowedModules.includes(module)) continue;
    if (re.test(text)) {
      tagList.forEach((t) => tags.add(t));
    }
  }
  return [...tags].slice(0, 5);
}

// ==================== 工具函数 ====================

function extractDifficulty(text: string): string | null {
  const m = text.match(/[（(]([高中低])[）)]/);
  return m ? m[1]! : null;
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/[（(][高中低][）)]/, '')
    .replace(/^\d+[.、]\s*/, '')
    .trim();
}

function extractSummary(answer: string): string {
  // 取第一段非空、非标题、非表格行，去 markdown 标记
  for (const line of answer.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('|')) continue;
    if (trimmed.startsWith('```')) continue;
    if (trimmed === '---') continue;
    // 去除 markdown 标记
    const clean = trimmed
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^[*-]\s+/, '');
    if (clean.length > 60) return clean.slice(0, 60) + '...';
    return clean;
  }
  return '';
}

function trimTrailing(lines: string[]): string[] {
  let end = lines.length;
  while (end > 0 && lines[end - 1]!.trim() === '') end--;
  return lines.slice(0, end);
}

// ==================== 解析 Markdown ====================

interface RawQuestion {
  title: string;
  answer: string;
  difficulty: string | null;
}

function parseMarkdown(content: string): RawQuestion[] {
  const lines = content.replace(/\r/g, '').split('\n');
  const questions: RawQuestion[] = [];

  // --- Pass 1: ### N. Title / #### N. Title ---
  const headerRe = /^#{3,4}\s+\d+[.、]\s*(.+)$/;
  let i = 0;
  while (i < lines.length) {
    const m = lines[i]!.match(headerRe);
    if (m) {
      const rawTitle = m[1]!.trim();
      const title = cleanTitle(rawTitle);
      const difficulty = extractDifficulty(rawTitle);
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^#{2,4}\s+\d+[.、]/.test(lines[i]!) && !/^\s{0,3}##\s+/.test(lines[i]!)) {
        if (lines[i]!.trim() === '---') { i++; break; }
        body.push(lines[i]!);
        i++;
      }
      const answer = trimTrailing(body).join('\n').trim();
      if (title && answer) questions.push({ title, answer, difficulty });
      continue;
    }
    i++;
  }

  // --- Pass 2: **Title（高）** (JUC 风格加粗文本) ---
  i = 0;
  while (i < lines.length) {
    const line = lines[i]!.trim();
    const bm = line.match(/^\*\*(.+[）)])\*\*$/);
    if (bm && extractDifficulty(bm[1]!)) {
      const rawTitle = bm[1]!.trim();
      const title = cleanTitle(rawTitle);
      const difficulty = extractDifficulty(rawTitle);
      const body: string[] = [];
      i++;
      while (i < lines.length) {
        const cur = lines[i]!.trim();
        if (cur === '---') { i++; break; }
        if (/^\*\*(.+[）)])\*\*$/.test(cur)) break;
        if (/^#{2,4}\s/.test(cur)) break;
        body.push(lines[i]!);
        i++;
      }
      const answer = trimTrailing(body).join('\n').trim();
      if (title && answer && !questions.some((q) => q.title === title)) {
        questions.push({ title, answer, difficulty });
      }
      continue;
    }
    i++;
  }

  // --- Pass 3: ### Title (计网风格，无编号无难度) ---
  if (questions.length === 0) {
    i = 0;
    while (i < lines.length) {
      const hm = lines[i]!.match(/^###\s+(.+)$/);
      if (hm && !/^#{3,4}\s+\d+[.、]/.test(lines[i]!)) {
        const title = cleanTitle(hm[1]!);
        const body: string[] = [];
        i++;
        while (i < lines.length) {
          if (/^#{2,3}\s/.test(lines[i]!)) break;
          if (lines[i]!.trim() === '---') { i++; break; }
          body.push(lines[i]!);
          i++;
        }
        const answer = trimTrailing(body).join('\n').trim();
        if (title && answer) questions.push({ title, answer, difficulty: null });
        continue;
      }
      i++;
    }
  }

  return questions;
}

// ==================== 文件名 → 模块 ====================

function createQuestionId(module: Module, title: string): string {
  const hash = crypto
    .createHash('sha1')
    .update(`${module}:${title}`)
    .digest('hex')
    .slice(0, 8);
  return `${module.toLowerCase()}-${hash}`;
}

function resolveModule(filename: string): Module {
  const base = filename.replace(/\.md$/i, '');
  for (const [prefix, mod] of Object.entries(FILE_MODULE_MAP)) {
    if (base.startsWith(prefix)) return mod;
  }
  const key = base.split('-')[0]!;
  const mod = FILE_MODULE_MAP[key];
  if (!mod) throw new Error(`无法识别文件名对应的模块: ${filename}`);
  return mod;
}

// ==================== 主流程 ====================

function main() {
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`docs/ 目录不存在: ${DOCS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith('.md')).sort();
  if (files.length === 0) {
    console.error('docs/ 目录下没有 .md 文件');
    process.exit(1);
  }

  const allQuestions: object[] = [];

  for (const file of files) {
    const module = resolveModule(file);
    const filePath = path.join(DOCS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = parseMarkdown(content);

    for (const q of parsed) {
      const id = createQuestionId(module, q.title);

      allQuestions.push({
        id,
        module,
        title: q.title,
        difficulty: q.difficulty ?? '中',
        tags: extractTags(q.title, q.answer, module),
        answer: q.answer,
        summary: extractSummary(q.answer),
        source: file,
        relatedQuestionIds: [],
      });
    }

    console.log(`  ${file} -> [${module}] x ${parsed.length}`);
  }

  const outDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 2), 'utf-8');

  console.log(`\n共 ${allQuestions.length} 道题 -> ${OUTPUT_FILE}`);
}

main();
