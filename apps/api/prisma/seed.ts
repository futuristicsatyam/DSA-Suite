import { PrismaClient, CategoryType, Difficulty, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const D = {
  EASY: Difficulty.BEGINNER,
  MEDIUM: Difficulty.INTERMEDIATE,
  HARD: Difficulty.ADVANCED,
};

async function main() {
  console.log('🌱 Seeding DSA Suite database...');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@1234', 10);
  const userHash = await bcrypt.hash('User@1234', 10);

  await prisma.user.upsert({
    where: { email: 'admin@dsasuite.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@dsasuite.com',
      phone: '+919000000001',
      passwordHash: adminHash,
      emailVerified: true,
      phoneVerified: true,
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'demo@dsasuite.com' },
    update: {},
    create: {
      name: 'Demo Learner',
      email: 'demo@dsasuite.com',
      phone: '+919000000002',
      passwordHash: userHash,
      emailVerified: true,
      phoneVerified: true,
      role: Role.USER,
    },
  });

  console.log('✅ Users seeded');

  // ── Helper ─────────────────────────────────────────────────────────────────
  async function upsertSubject(
    categoryType: CategoryType,
    name: string,
    slug: string,
    description: string,
    orderIndex: number,
    topics: { title: string; slug: string; shortDescription: string; difficulty: Difficulty; order: number }[],
  ) {
    const subject = await prisma.subject.upsert({
      where: { slug },
      update: { name, description, categoryType, orderIndex },
      create: { name, slug, description, categoryType, orderIndex },
    });

    for (const t of topics) {
      await prisma.topic.upsert({
        where: { slug: t.slug },
        update: { title: t.title, shortDescription: t.shortDescription, difficulty: t.difficulty, orderIndex: t.order },
        create: { subjectId: subject.id, title: t.title, slug: t.slug, shortDescription: t.shortDescription, difficulty: t.difficulty, orderIndex: t.order },
      });
    }
    return subject;
  }

  // ── DSA Subjects ───────────────────────────────────────────────────────────
  await upsertSubject(CategoryType.DSA, 'Arrays', 'arrays', 'The most fundamental data structure.', 1, [
    { title: 'Introduction to Arrays', slug: 'arrays-intro', shortDescription: 'Basics of arrays, indexing, and traversal', difficulty: D.EASY, order: 1 },
    { title: 'Array Rotation', slug: 'array-rotation', shortDescription: 'Left and right rotation algorithms', difficulty: D.EASY, order: 2 },
    { title: "Kadane's Algorithm", slug: 'kadanes-algorithm', shortDescription: 'Maximum subarray sum in O(n)', difficulty: D.MEDIUM, order: 3 },
    { title: 'Dutch National Flag', slug: 'dutch-national-flag', shortDescription: '3-way partitioning in one pass', difficulty: D.MEDIUM, order: 4 },
    { title: 'Prefix Sum', slug: 'prefix-sum', shortDescription: 'Range queries in O(1) after O(n) preprocessing', difficulty: D.EASY, order: 5 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Strings', 'strings', 'String manipulation and pattern matching.', 2, [
    { title: 'String Basics', slug: 'strings-basics', shortDescription: 'String operations and immutability', difficulty: D.EASY, order: 1 },
    { title: 'KMP Algorithm', slug: 'kmp-algorithm', shortDescription: 'Knuth-Morris-Pratt pattern matching in O(n+m)', difficulty: D.HARD, order: 2 },
    { title: 'Rabin-Karp', slug: 'rabin-karp', shortDescription: 'Rolling hash for pattern search', difficulty: D.HARD, order: 3 },
    { title: 'Anagram Check', slug: 'anagram-check', shortDescription: 'Detecting anagrams efficiently', difficulty: D.EASY, order: 4 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Linked List', 'linked-list', 'Singly, doubly, and circular linked lists.', 3, [
    { title: 'Singly Linked List', slug: 'singly-linked-list', shortDescription: 'Insert, delete, search operations', difficulty: D.EASY, order: 1 },
    { title: 'Doubly Linked List', slug: 'doubly-linked-list', shortDescription: 'Bidirectional traversal', difficulty: D.EASY, order: 2 },
    { title: "Floyd's Cycle Detection", slug: 'cycle-detection', shortDescription: 'Tortoise and hare algorithm', difficulty: D.MEDIUM, order: 3 },
    { title: 'Reverse a Linked List', slug: 'reverse-linked-list', shortDescription: 'Iterative and recursive reversal', difficulty: D.EASY, order: 4 },
    { title: 'Merge Two Sorted Lists', slug: 'merge-sorted-lists', shortDescription: 'Merging strategy with two pointers', difficulty: D.MEDIUM, order: 5 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Stack', 'stack', 'LIFO data structure with applications.', 4, [
    { title: 'Stack Implementation', slug: 'stack-impl', shortDescription: 'Array and linked list implementations', difficulty: D.EASY, order: 1 },
    { title: 'Balanced Parentheses', slug: 'balanced-parens', shortDescription: 'Validate bracket sequences', difficulty: D.EASY, order: 2 },
    { title: 'Next Greater Element', slug: 'next-greater-element', shortDescription: 'Monotonic stack pattern', difficulty: D.MEDIUM, order: 3 },
    { title: 'Min Stack', slug: 'min-stack', shortDescription: 'O(1) minimum retrieval', difficulty: D.MEDIUM, order: 4 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Queue', 'queue', 'FIFO data structure and its variants.', 5, [
    { title: 'Queue Implementation', slug: 'queue-impl', shortDescription: 'Array and linked list implementations', difficulty: D.EASY, order: 1 },
    { title: 'Circular Queue', slug: 'circular-queue', shortDescription: 'Fixed-size circular buffer', difficulty: D.EASY, order: 2 },
    { title: 'Sliding Window Maximum', slug: 'sliding-window-max', shortDescription: 'Deque-based sliding window', difficulty: D.HARD, order: 3 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Tree', 'tree', 'Binary trees, traversals, and properties.', 6, [
    { title: 'Binary Tree Basics', slug: 'binary-tree-basics', shortDescription: 'Nodes, depth, height, leaves', difficulty: D.EASY, order: 1 },
    { title: 'Tree Traversals', slug: 'tree-traversals', shortDescription: 'Inorder, Preorder, Postorder, BFS', difficulty: D.EASY, order: 2 },
    { title: 'LCA of Binary Tree', slug: 'lca-binary-tree', shortDescription: 'Lowest common ancestor algorithms', difficulty: D.MEDIUM, order: 3 },
    { title: 'Diameter of Tree', slug: 'tree-diameter', shortDescription: 'Longest path between two nodes', difficulty: D.MEDIUM, order: 4 },
    { title: 'Height Balanced BST', slug: 'height-balanced-bst', shortDescription: 'AVL and Red-Black trees', difficulty: D.HARD, order: 5 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Graph', 'graph', 'Graph representations and traversal algorithms.', 7, [
    { title: 'Graph Representation', slug: 'graph-representation', shortDescription: 'Adjacency matrix vs list', difficulty: D.EASY, order: 1 },
    { title: 'BFS Traversal', slug: 'bfs', shortDescription: 'Breadth-first search with queue', difficulty: D.EASY, order: 2 },
    { title: 'DFS Traversal', slug: 'dfs', shortDescription: 'Depth-first search with recursion/stack', difficulty: D.EASY, order: 3 },
    { title: "Dijkstra's Algorithm", slug: 'dijkstra', shortDescription: 'Shortest path with priority queue', difficulty: D.MEDIUM, order: 4 },
    { title: 'Topological Sort', slug: 'topological-sort', shortDescription: "Ordering in DAGs via Kahn's / DFS", difficulty: D.MEDIUM, order: 5 },
    { title: "Bellman-Ford", slug: 'bellman-ford', shortDescription: 'Shortest path with negative edges', difficulty: D.MEDIUM, order: 6 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Dynamic Programming', 'dynamic-programming', 'Memoization and tabulation techniques.', 8, [
    { title: 'DP Introduction', slug: 'dp-intro', shortDescription: 'Overlapping subproblems and optimal substructure', difficulty: D.MEDIUM, order: 1 },
    { title: '0/1 Knapsack', slug: 'knapsack-01', shortDescription: 'Classic DP with items and capacity', difficulty: D.MEDIUM, order: 2 },
    { title: 'Longest Common Subsequence', slug: 'lcs', shortDescription: 'LCS with 2D DP table', difficulty: D.MEDIUM, order: 3 },
    { title: 'Coin Change', slug: 'coin-change', shortDescription: 'Minimum coins for a target sum', difficulty: D.MEDIUM, order: 4 },
    { title: 'Matrix Chain Multiplication', slug: 'matrix-chain', shortDescription: 'Optimal parenthesization', difficulty: D.HARD, order: 5 },
    { title: 'Longest Increasing Subsequence', slug: 'lis', shortDescription: 'LIS in O(n log n)', difficulty: D.MEDIUM, order: 6 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Sorting', 'sorting', 'Comparison and non-comparison sorting.', 9, [
    { title: 'Bubble Sort', slug: 'bubble-sort', shortDescription: 'Simple O(n²) sorting', difficulty: D.EASY, order: 1 },
    { title: 'Merge Sort', slug: 'merge-sort', shortDescription: 'Divide and conquer O(n log n)', difficulty: D.MEDIUM, order: 2 },
    { title: 'Quick Sort', slug: 'quick-sort', shortDescription: 'Pivot-based partitioning', difficulty: D.MEDIUM, order: 3 },
    { title: 'Heap Sort', slug: 'heap-sort', shortDescription: 'In-place O(n log n) using heap', difficulty: D.MEDIUM, order: 4 },
    { title: 'Counting Sort', slug: 'counting-sort', shortDescription: 'Linear time for integer keys', difficulty: D.EASY, order: 5 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Binary Search', 'binary-search', 'Logarithmic search on sorted data.', 10, [
    { title: 'Binary Search Basics', slug: 'binary-search-basics', shortDescription: 'Classic search in sorted array', difficulty: D.EASY, order: 1 },
    { title: 'Lower & Upper Bound', slug: 'lower-upper-bound', shortDescription: 'Finding boundaries with binary search', difficulty: D.MEDIUM, order: 2 },
    { title: 'Binary Search on Answer', slug: 'binary-search-answer', shortDescription: 'Applying BS to optimization problems', difficulty: D.HARD, order: 3 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Greedy', 'greedy', 'Greedy choice property and proofs.', 11, [
    { title: 'Activity Selection', slug: 'activity-selection', shortDescription: 'Maximize non-overlapping activities', difficulty: D.MEDIUM, order: 1 },
    { title: 'Fractional Knapsack', slug: 'fractional-knapsack', shortDescription: 'Greedy by value/weight ratio', difficulty: D.MEDIUM, order: 2 },
    { title: 'Huffman Encoding', slug: 'huffman-encoding', shortDescription: 'Optimal prefix-free codes', difficulty: D.HARD, order: 3 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Two Pointers', 'two-pointers', 'Efficient linear-time array techniques.', 12, [
    { title: 'Two Sum (Sorted)', slug: 'two-sum-sorted', shortDescription: 'Find pair summing to target', difficulty: D.EASY, order: 1 },
    { title: 'Three Sum', slug: 'three-sum', shortDescription: 'Find triplets summing to zero', difficulty: D.MEDIUM, order: 2 },
    { title: 'Container With Most Water', slug: 'container-water', shortDescription: 'Maximize area with two pointers', difficulty: D.MEDIUM, order: 3 },
  ]);

  await upsertSubject(CategoryType.DSA, 'Sliding Window', 'sliding-window', 'Window-based subarray problems.', 13, [
    { title: 'Max Sum Subarray of Size K', slug: 'max-sum-subarray-k', shortDescription: 'Fixed-size sliding window', difficulty: D.EASY, order: 1 },
    { title: 'Longest Substring Without Repeating', slug: 'longest-unique-substr', shortDescription: 'Variable-size window with set', difficulty: D.MEDIUM, order: 2 },
  ]);

  console.log('✅ DSA subjects seeded');

  // ── CP Subjects ────────────────────────────────────────────────────────────
  await upsertSubject(CategoryType.CP, 'Time Complexity', 'cp-time-complexity', 'Analyzing algorithmic efficiency.', 1, [
    { title: 'Big-O Notation', slug: 'big-o', shortDescription: 'O, Ω, Θ notation explained', difficulty: D.EASY, order: 1 },
    { title: 'Amortized Analysis', slug: 'amortized-analysis', shortDescription: 'Average cost over sequences of ops', difficulty: D.MEDIUM, order: 2 },
  ]);

  await upsertSubject(CategoryType.CP, 'Number Theory', 'number-theory', 'Mathematical foundations for CP.', 2, [
    { title: 'Sieve of Eratosthenes', slug: 'sieve', shortDescription: 'Finding all primes up to N', difficulty: D.EASY, order: 1 },
    { title: 'GCD and LCM', slug: 'gcd-lcm', shortDescription: 'Euclidean algorithm and applications', difficulty: D.EASY, order: 2 },
    { title: 'Modular Arithmetic', slug: 'modular-arithmetic', shortDescription: 'Modular inverse, fast exponentiation', difficulty: D.MEDIUM, order: 3 },
    { title: 'Chinese Remainder Theorem', slug: 'crt', shortDescription: 'Solving systems of congruences', difficulty: D.HARD, order: 4 },
  ]);

  await upsertSubject(CategoryType.CP, 'Graph Algorithms', 'cp-graph-algorithms', 'Advanced graph problems for contests.', 3, [
    { title: 'Floyd-Warshall', slug: 'floyd-warshall', shortDescription: 'All-pairs shortest paths in O(V³)', difficulty: D.MEDIUM, order: 1 },
    { title: 'Strongly Connected Components', slug: 'scc', shortDescription: "Kosaraju's and Tarjan's algorithms", difficulty: D.HARD, order: 2 },
    { title: 'Minimum Spanning Tree', slug: 'mst', shortDescription: "Kruskal's and Prim's algorithms", difficulty: D.MEDIUM, order: 3 },
    { title: 'Network Flow', slug: 'network-flow', shortDescription: 'Max flow min cut theorem', difficulty: D.HARD, order: 4 },
  ]);

  await upsertSubject(CategoryType.CP, 'Dynamic Programming', 'cp-dp', 'Advanced DP patterns for contests.', 4, [
    { title: 'Digit DP', slug: 'digit-dp', shortDescription: 'Counting numbers with digit constraints', difficulty: D.HARD, order: 1 },
    { title: 'Bitmask DP', slug: 'bitmask-dp', shortDescription: 'DP on subsets using bitmasks', difficulty: D.HARD, order: 2 },
    { title: 'DP on Trees', slug: 'dp-on-trees', shortDescription: 'Tree DP with rerooting technique', difficulty: D.HARD, order: 3 },
  ]);

  await upsertSubject(CategoryType.CP, 'String Algorithms', 'cp-strings', 'Advanced string algorithms for CP.', 5, [
    { title: 'Z-Function', slug: 'z-function', shortDescription: 'Linear time string matching', difficulty: D.HARD, order: 1 },
    { title: 'Suffix Array', slug: 'suffix-array', shortDescription: 'Sorted array of all suffixes', difficulty: D.HARD, order: 2 },
    { title: 'Aho-Corasick', slug: 'aho-corasick', shortDescription: 'Multi-pattern string matching', difficulty: D.HARD, order: 3 },
  ]);

  console.log('✅ CP subjects seeded');

  // ── GATE Subjects ──────────────────────────────────────────────────────────
  await upsertSubject(CategoryType.GATE, 'Discrete Mathematics', 'discrete-mathematics', 'Mathematical foundations for CS.', 1, [
    { title: 'Set Theory', slug: 'set-theory', shortDescription: 'Sets, relations, and functions', difficulty: D.EASY, order: 1 },
    { title: 'Graph Theory', slug: 'graph-theory', shortDescription: 'Trees, planarity, coloring', difficulty: D.MEDIUM, order: 2 },
    { title: 'Combinatorics', slug: 'combinatorics', shortDescription: 'Permutations, combinations, pigeonhole', difficulty: D.MEDIUM, order: 3 },
    { title: 'Propositional Logic', slug: 'propositional-logic', shortDescription: 'Truth tables, inference rules', difficulty: D.EASY, order: 4 },
    { title: 'Recurrence Relations', slug: 'recurrence-relations', shortDescription: 'Master theorem and solving recurrences', difficulty: D.MEDIUM, order: 5 },
  ]);

  await upsertSubject(CategoryType.GATE, 'Algorithms', 'gate-algorithms', 'Algorithm design and analysis for GATE.', 2, [
    { title: 'Asymptotic Notation', slug: 'gate-asymptotic', shortDescription: 'Big-O, Omega, Theta analysis', difficulty: D.EASY, order: 1 },
    { title: 'Divide and Conquer', slug: 'divide-conquer', shortDescription: 'Master theorem and recurrences', difficulty: D.MEDIUM, order: 2 },
    { title: 'Dynamic Programming (GATE)', slug: 'gate-dp', shortDescription: 'Classic DP problems for GATE', difficulty: D.MEDIUM, order: 3 },
    { title: 'NP-Completeness', slug: 'np-completeness', shortDescription: 'P, NP, NP-hard, reductions', difficulty: D.HARD, order: 4 },
  ]);

  await upsertSubject(CategoryType.GATE, 'Operating Systems', 'operating-systems', 'OS concepts for GATE CSE.', 3, [
    { title: 'Process Management', slug: 'os-process-mgmt', shortDescription: 'Process states, PCB, context switching', difficulty: D.MEDIUM, order: 1 },
    { title: 'CPU Scheduling', slug: 'cpu-scheduling', shortDescription: 'FCFS, SJF, Round Robin, Priority', difficulty: D.MEDIUM, order: 2 },
    { title: 'Deadlocks', slug: 'deadlocks', shortDescription: 'Conditions, detection, prevention, avoidance', difficulty: D.MEDIUM, order: 3 },
    { title: 'Memory Management', slug: 'memory-management', shortDescription: 'Paging, segmentation, fragmentation', difficulty: D.MEDIUM, order: 4 },
    { title: 'Virtual Memory', slug: 'virtual-memory', shortDescription: 'Demand paging and page replacement', difficulty: D.HARD, order: 5 },
    { title: 'File Systems', slug: 'file-systems', shortDescription: 'FAT, inode, directory structures', difficulty: D.MEDIUM, order: 6 },
  ]);

  await upsertSubject(CategoryType.GATE, 'Databases', 'databases', 'DBMS and SQL for GATE CSE.', 4, [
    { title: 'ER Model', slug: 'er-model', shortDescription: 'Entity-relationship diagrams and mapping', difficulty: D.EASY, order: 1 },
    { title: 'Relational Algebra', slug: 'relational-algebra', shortDescription: 'Select, project, join operations', difficulty: D.MEDIUM, order: 2 },
    { title: 'Normalization', slug: 'normalization', shortDescription: '1NF through BCNF with examples', difficulty: D.MEDIUM, order: 3 },
    { title: 'Transaction Management', slug: 'transactions', shortDescription: 'ACID, serializability, isolation levels', difficulty: D.HARD, order: 4 },
    { title: 'Indexing and B-Trees', slug: 'indexing', shortDescription: 'Dense/sparse indexes and B+ trees', difficulty: D.HARD, order: 5 },
  ]);

  await upsertSubject(CategoryType.GATE, 'Computer Networks', 'computer-networks', 'Networking concepts for GATE.', 5, [
    { title: 'OSI and TCP/IP Model', slug: 'osi-tcp-ip', shortDescription: 'Layer functions and comparison', difficulty: D.EASY, order: 1 },
    { title: 'Data Link Layer', slug: 'data-link-layer', shortDescription: 'Framing, error control, flow control', difficulty: D.MEDIUM, order: 2 },
    { title: 'IP Addressing', slug: 'ip-addressing', shortDescription: 'IPv4, subnetting, CIDR', difficulty: D.MEDIUM, order: 3 },
    { title: 'Routing Algorithms', slug: 'routing', shortDescription: 'Distance vector and link state routing', difficulty: D.HARD, order: 4 },
    { title: 'TCP vs UDP', slug: 'tcp-vs-udp', shortDescription: 'Connection-oriented vs connectionless', difficulty: D.MEDIUM, order: 5 },
  ]);

  await upsertSubject(CategoryType.GATE, 'Theory of Computation', 'theory-of-computation', 'Automata, formal languages, computability.', 6, [
    { title: 'Finite Automata', slug: 'finite-automata', shortDescription: 'DFA, NFA, and equivalence', difficulty: D.MEDIUM, order: 1 },
    { title: 'Regular Languages', slug: 'regular-languages', shortDescription: 'Regular expressions and closure properties', difficulty: D.MEDIUM, order: 2 },
    { title: 'Context-Free Grammars', slug: 'cfg', shortDescription: 'CFG, parse trees, ambiguity', difficulty: D.MEDIUM, order: 3 },
    { title: 'Pushdown Automata', slug: 'pda', shortDescription: 'PDA and CFL recognition', difficulty: D.HARD, order: 4 },
    { title: 'Turing Machines', slug: 'turing-machines', shortDescription: 'TM definition and computability', difficulty: D.HARD, order: 5 },
  ]);

  await upsertSubject(CategoryType.GATE, 'Digital Logic', 'digital-logic', 'Boolean algebra and digital circuits.', 7, [
    { title: 'Boolean Algebra', slug: 'boolean-algebra', shortDescription: 'Laws, theorems, simplification', difficulty: D.EASY, order: 1 },
    { title: 'Karnaugh Maps', slug: 'karnaugh-maps', shortDescription: 'K-map minimization technique', difficulty: D.MEDIUM, order: 2 },
    { title: 'Combinational Circuits', slug: 'combinational-circuits', shortDescription: 'Adders, MUX, decoders', difficulty: D.MEDIUM, order: 3 },
    { title: 'Sequential Circuits', slug: 'sequential-circuits', shortDescription: 'Flip-flops, registers, counters', difficulty: D.MEDIUM, order: 4 },
  ]);

  await upsertSubject(CategoryType.GATE, 'Compiler Design', 'compiler-design', 'Phases of compilation for GATE.', 8, [
    { title: 'Lexical Analysis', slug: 'lexical-analysis', shortDescription: 'Tokenization and regular expressions', difficulty: D.MEDIUM, order: 1 },
    { title: 'Parsing', slug: 'parsing', shortDescription: 'LL(1), LR(0), SLR, LALR parsers', difficulty: D.HARD, order: 2 },
    { title: 'Code Optimization', slug: 'code-optimization', shortDescription: 'Local and global optimizations', difficulty: D.HARD, order: 3 },
  ]);

  console.log('✅ GATE subjects seeded');

  // ── Sample Editorials ──────────────────────────────────────────────────────
  const editorialData = [
    {
      topicSlug: 'arrays-intro',
      slug: 'editorial-arrays-intro',
      title: 'Introduction to Arrays',
      summary: 'Master the most fundamental data structure in programming.',
      tags: ['arrays', 'basics', 'dsa'],
      estimatedMinutes: 10,
      markdownContent: `# Introduction to Arrays

Arrays store elements in **contiguous memory locations**, allowing O(1) random access.

## Key Properties

| Operation | Time Complexity |
|-----------|----------------|
| Access | O(1) |
| Search | O(n) |
| Insertion (end) | O(1) amortized |
| Insertion (middle) | O(n) |
| Deletion | O(n) |

## Declaration

\`\`\`cpp
// Static array
int arr[5] = {1, 2, 3, 4, 5};

// Dynamic array
vector<int> v = {1, 2, 3, 4, 5};
v.push_back(6);
\`\`\`

\`\`\`python
arr = [1, 2, 3, 4, 5]
arr.append(6)
\`\`\`

## Prefix Sum Pattern

\`\`\`cpp
vector<int> pre(n + 1, 0);
for (int i = 0; i < n; i++)
    pre[i + 1] = pre[i] + arr[i];

// Range sum [l, r]:
int sum = pre[r + 1] - pre[l];
\`\`\`

> [!TIP]
> Prefix sums let you answer range queries in O(1) after O(n) preprocessing.`,
    },
    {
      topicSlug: 'kadanes-algorithm',
      slug: 'editorial-kadanes-algorithm',
      title: "Kadane's Algorithm",
      summary: 'Maximum subarray sum solved in O(n) time.',
      tags: ['arrays', 'dp', 'greedy'],
      estimatedMinutes: 15,
      markdownContent: `# Kadane's Algorithm

Finds the **maximum subarray sum** in $O(n)$ time and $O(1)$ space.

## Algorithm

\`\`\`cpp
int maxSubarraySum(vector<int>& arr) {
    int maxSum = arr[0];
    int cur = arr[0];

    for (int i = 1; i < arr.size(); i++) {
        cur = max(arr[i], cur + arr[i]);
        maxSum = max(maxSum, cur);
    }
    return maxSum;
}
\`\`\`

## Intuition

At each index, decide:
- **Extend** current subarray: \`cur + arr[i]\`
- **Start fresh**: \`arr[i]\`

$$\\text{cur}[i] = \\max(\\text{arr}[i],\\ \\text{cur}[i-1] + \\text{arr}[i])$$

> [!TIP]
> If \`cur\` goes negative, always start a new subarray.

## Complexity

$$T = O(n), \\quad S = O(1)$$`,
    },
    {
      topicSlug: 'bfs',
      slug: 'editorial-bfs',
      title: 'Breadth-First Search',
      summary: 'Level-order graph traversal using a queue.',
      tags: ['graphs', 'bfs', 'traversal'],
      estimatedMinutes: 20,
      markdownContent: `# Breadth-First Search (BFS)

BFS explores a graph **level by level** using a queue.

## Implementation

\`\`\`cpp
void bfs(int src, vector<vector<int>>& adj, int n) {
    vector<bool> visited(n, false);
    queue<int> q;
    visited[src] = true;
    q.push(src);

    while (!q.empty()) {
        int node = q.front(); q.pop();
        cout << node << " ";
        for (int nb : adj[node]) {
            if (!visited[nb]) {
                visited[nb] = true;
                q.push(nb);
            }
        }
    }
}
\`\`\`

## Shortest Path

\`\`\`cpp
vector<int> bfsDistance(int src, vector<vector<int>>& adj, int n) {
    vector<int> dist(n, -1);
    queue<int> q;
    dist[src] = 0;
    q.push(src);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;
}
\`\`\`

$$T = O(V + E), \\quad S = O(V)$$

> [!NOTE]
> BFS guarantees shortest path **by edge count** in unweighted graphs.`,
    },
    {
      topicSlug: 'dp-intro',
      slug: 'editorial-dp-intro',
      title: 'Introduction to Dynamic Programming',
      summary: 'Understanding overlapping subproblems and optimal substructure.',
      tags: ['dp', 'recursion', 'memoization'],
      estimatedMinutes: 25,
      markdownContent: `# Introduction to Dynamic Programming

DP breaks problems into **overlapping subproblems** and stores results.

## Two Key Properties

1. **Optimal Substructure** — Optimal solution contains optimal sub-solutions
2. **Overlapping Subproblems** — Same subproblems solved multiple times

## Top-Down (Memoization)

\`\`\`cpp
unordered_map<int, long long> memo;
long long fib(int n) {
    if (n <= 1) return n;
    if (memo.count(n)) return memo[n];
    return memo[n] = fib(n-1) + fib(n-2);
}
\`\`\`

## Bottom-Up (Tabulation)

\`\`\`cpp
long long fib(int n) {
    vector<long long> dp(n+1);
    dp[0] = 0; dp[1] = 1;
    for (int i = 2; i <= n; i++)
        dp[i] = dp[i-1] + dp[i-2];
    return dp[n];
}
\`\`\`

## Complexity Comparison

| Approach | Time | Space |
|----------|------|-------|
| Brute Force | $O(2^n)$ | $O(n)$ |
| Memoization | $O(n)$ | $O(n)$ |
| Tabulation | $O(n)$ | $O(n)$ |

> [!TIP]
> If a problem asks for **min/max**, **count of ways**, or **is it possible** — it's likely DP.`,
    },
    {
      topicSlug: 'big-o',
      slug: 'editorial-big-o',
      title: 'Big-O Notation',
      summary: 'Analyzing algorithm efficiency with asymptotic notation.',
      tags: ['complexity', 'big-o', 'analysis'],
      estimatedMinutes: 15,
      markdownContent: `# Big-O Notation

Big-O describes the **upper bound** on growth rate as input $n$ grows.

## Common Complexities

| Complexity | Name | Example |
|------------|------|---------|
| $O(1)$ | Constant | Array access |
| $O(\\log n)$ | Logarithmic | Binary search |
| $O(n)$ | Linear | Linear scan |
| $O(n \\log n)$ | Linearithmic | Merge sort |
| $O(n^2)$ | Quadratic | Bubble sort |
| $O(2^n)$ | Exponential | Brute force subsets |

## Simplification Rules

**Drop constants:** $O(2n) = O(n)$

**Drop lower terms:** $O(n^2 + n) = O(n^2)$

**Loops multiply:**
\`\`\`cpp
for (int i = 0; i < n; i++)       // O(n)
    for (int j = 0; j < n; j++)   //   × O(n)
        doWork();                  // = O(n²)
\`\`\`

> [!WARNING]
> Recursion uses **stack space**. Depth-$n$ recursion = $O(n)$ space.`,
    },
  ];

  for (const ed of editorialData) {
    const topic = await prisma.topic.findUnique({ where: { slug: ed.topicSlug } });
    if (!topic) {
      console.warn(`⚠️  Topic not found: ${ed.topicSlug}`);
      continue;
    }
    await prisma.editorial.upsert({
      where: { slug: ed.slug },
      update: { title: ed.title, summary: ed.summary, markdownContent: ed.markdownContent, tags: ed.tags, estimatedMinutes: ed.estimatedMinutes, published: true },
      create: { slug: ed.slug, topicId: topic.id, title: ed.title, summary: ed.summary, markdownContent: ed.markdownContent, tags: ed.tags, estimatedMinutes: ed.estimatedMinutes, published: true },
    });
  }

  console.log('✅ Sample editorials seeded');

    // ── Sample Problems ──────────────────────────────────────────────────────
  const arraysIntro = await prisma.topic.findUnique({ where: { slug: 'arrays-intro' } });
  const kadanes = await prisma.topic.findUnique({ where: { slug: 'kadanes-algorithm' } });

  if (arraysIntro) {
    const p1 = await prisma.problem.upsert({
      where: { slug: 'two-sum' },
      update: {},
      create: {
        topicId: arraysIntro.id, title: 'Two Sum', slug: 'two-sum',
        description: '# Two Sum\n\nGiven an array of `n` integers and a `target`, print the indices of two numbers that add up to target.\n\n## Input\n- First line: `n` (size of array)\n- Second line: `n` space-separated integers\n- Third line: `target`\n\n## Output\n- Two space-separated indices (0-based)\n\n## Example\n```\nInput:\n4\n2 7 11 15\n9\n\nOutput:\n0 1\n```',
        difficulty: 'BEGINNER', constraints: '2 <= n <= 10^4', hints: ['Try a hash map'],
        tags: ['array', 'hash-map'], timeLimit: 2, memoryLimit: 256, orderIndex: 1, published: true,
      },
    });
    await prisma.testCase.deleteMany({ where: { problemId: p1.id } });
    await prisma.testCase.createMany({ data: [
      { problemId: p1.id, input: '4\n2 7 11 15\n9', expected: '0 1', isHidden: false, orderIndex: 1 },
      { problemId: p1.id, input: '3\n3 2 4\n6', expected: '1 2', isHidden: false, orderIndex: 2 },
      { problemId: p1.id, input: '2\n3 3\n6', expected: '0 1', isHidden: true, orderIndex: 3 },
    ]});

    const p2 = await prisma.problem.upsert({
      where: { slug: 'reverse-array' },
      update: {},
      create: {
        topicId: arraysIntro.id, title: 'Reverse Array', slug: 'reverse-array',
        description: '# Reverse Array\n\nGiven an array, print it in reverse order.\n\n## Input\n- First line: `n`\n- Second line: `n` space-separated integers\n\n## Output\n- Reversed array, space-separated',
        difficulty: 'BEGINNER', constraints: '1 <= n <= 10^5',
        tags: ['array'], timeLimit: 2, memoryLimit: 256, orderIndex: 2, published: true,
      },
    });
    await prisma.testCase.deleteMany({ where: { problemId: p2.id } });
    await prisma.testCase.createMany({ data: [
      { problemId: p2.id, input: '5\n1 2 3 4 5', expected: '5 4 3 2 1', isHidden: false, orderIndex: 1 },
      { problemId: p2.id, input: '3\n10 20 30', expected: '30 20 10', isHidden: true, orderIndex: 2 },
    ]});
  }

  if (kadanes) {
    const p3 = await prisma.problem.upsert({
      where: { slug: 'max-subarray-sum' },
      update: {},
      create: {
        topicId: kadanes.id, title: 'Maximum Subarray Sum', slug: 'max-subarray-sum',
        description: '# Maximum Subarray Sum\n\nFind the contiguous subarray with the largest sum.\n\n## Input\n- First line: `n`\n- Second line: `n` space-separated integers\n\n## Output\n- Maximum subarray sum',
        difficulty: 'INTERMEDIATE', constraints: '1 <= n <= 10^5',
        tags: ['array', 'dp', 'kadane'], timeLimit: 2, memoryLimit: 256, orderIndex: 1, published: true,
      },
    });
    await prisma.testCase.deleteMany({ where: { problemId: p3.id } });
    await prisma.testCase.createMany({ data: [
      { problemId: p3.id, input: '8\n-2 1 -3 4 -1 2 1 -5', expected: '6', isHidden: false, orderIndex: 1 },
      { problemId: p3.id, input: '5\n1 2 3 4 5', expected: '15', isHidden: false, orderIndex: 2 },
      { problemId: p3.id, input: '3\n-1 -2 -3', expected: '-1', isHidden: true, orderIndex: 3 },
    ]});
  }

  console.log('✅ Sample problems seeded');
  console.log('\n🎉 Seeding complete!');
  console.log('   Admin: admin@dsasuite.com / Admin@1234');
  console.log('   Demo:  demo@dsasuite.com  / User@1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
