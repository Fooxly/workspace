// ...{ '**/.git': true, '**/.svn': true, '**/.hg': true, '**/CVS': true, '**/.DS_Store': true, '**/Thumbs.db': true },
// ...(isWeb ? { '**/*.crswap': true /* filter out swap files used for local file access */ } : undefined)
export const DEFAULT_EXCLUDE_PATTERNS = ['**/.git', '**/.svn', '**/.hg', '**/CVS', '**/.DS_Store', '**/Thumbs.db', '**/*.crswap'];
