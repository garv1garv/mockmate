from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict
import random
import uuid

from app.services.ai_provider import ai_generate_question

router = APIRouter()


class GenerateQuestionRequest(BaseModel):
    type: str = "technical"
    difficulty: str = "medium"
    category: str = "general"
    user_profile: Optional[Dict] = {}
    previous_questions: Optional[List[str]] = []
    company: Optional[str] = None
    job_description: Optional[str] = None
    resume_text: Optional[str] = None
    ai_settings: Optional[Dict] = {}


# ── Static question bank (fallback when AI is unavailable) ───────────────────
QUESTION_BANK = {
    "technical": {
        "data-structures": {
            "easy": [
                {"text": "What is the difference between an array and a linked list?", "keywords": ["contiguous", "pointer", "dynamic", "random access"], "expected": "Arrays use contiguous memory with O(1) random access but fixed size. Linked lists use pointers with O(n) access but dynamic size."},
                {"text": "Explain what a stack is and give a real-world use case.", "keywords": ["LIFO", "push", "pop", "call stack", "undo"], "expected": "A stack is a LIFO data structure. Real-world uses include browser history, undo operations, and the call stack in programming."},
                {"text": "What is a hash table and how does it work?", "keywords": ["hash function", "collision", "key-value", "O(1)"], "expected": "A hash table maps keys to values using a hash function. It provides average O(1) lookups, insertions, and deletions."},
                {"text": "What is a Queue and how does it differ from a Stack?", "keywords": ["FIFO", "LIFO", "enqueue", "dequeue"], "expected": "A Queue is FIFO (First-In First-Out) while a Stack is LIFO (Last-In First-Out)."},
                {"text": "Explain the concept of a Binary Tree.", "keywords": ["nodes", "left child", "right child", "hierarchy"], "expected": "A hierarchical data structure where each node has at most two children, referred to as the left and right child."},
                {"text": "What is a Doubly Linked List?", "keywords": ["previous pointer", "next pointer", "bidirectional", "overhead"], "expected": "A linked list where each node contains pointers to both the previous and next nodes."},
                {"text": "Explain the difference between a Set and an Array.", "keywords": ["unique", "unordered", "collection", "membership"], "expected": "A Set only stores unique elements and usually provides faster membership testing than an Array."},
            ],
            "medium": [
                {"text": "Explain the difference between BFS and DFS graph traversal algorithms.", "keywords": ["queue", "stack", "level-order", "depth", "breadth"], "expected": "BFS uses a queue and explores level by level, ideal for shortest paths. DFS uses a stack and explores as deep as possible, ideal for topological sorting."},
                {"text": "What is a balanced binary search tree and why is it important?", "keywords": ["AVL", "Red-Black", "height", "O(log n)", "rotation"], "expected": "A balanced BST maintains O(log n) height ensuring O(log n) operations. Examples: AVL trees and Red-Black trees use rotations to maintain balance."},
                {"text": "Explain dynamic programming and its two main approaches.", "keywords": ["memoization", "tabulation", "overlapping subproblems", "optimal substructure"], "expected": "DP solves problems by breaking them into overlapping subproblems. Top-down (memoization) caches recursive results; bottom-up (tabulation) builds solutions iteratively."},
                {"text": "How does a Trie (Prefix Tree) work and what are its common applications?", "keywords": ["prefix", "autocomplete", "search", "dictionary"], "expected": "A Trie stores characters in nodes to form words along paths. Common for autocomplete and dictionary searches."},
                {"text": "Explain the difference between a Max-Heap and a Min-Heap.", "keywords": ["priority queue", "root", "parent", "child"], "expected": "In a Max-Heap, the parent node is always greater than its children. In a Min-Heap, it is always smaller."},
                {"text": "What is a Graph and what are the common ways to represent it?", "keywords": ["nodes", "edges", "adjacency list", "adjacency matrix"], "expected": "A collection of nodes and edges. Representations include Adjacency List (space-efficient) and Adjacency Matrix (fast edge lookup)."},
                {"text": "Explain the concept of Hashing and Collision resolution.", "keywords": ["hash function", "chaining", "open addressing", "bucket"], "expected": "Hashing transforms a key into an index. Collisions occur when two keys hash to the same index; they are resolved via chaining (linked lists) or open addressing."},
            ],
            "hard": [
                {"text": "Design a data structure that supports insert, delete, and getRandom in O(1) time.", "keywords": ["hashmap", "array", "index tracking", "swap"], "expected": "Use a hashmap for element-to-index mapping and an array for O(1) random access. For delete, swap target with last element, update map, and pop."},
                {"text": "Explain the implementation and trade-offs of a skip list.", "keywords": ["probabilistic", "O(log n)", "layers", "sentinel"], "expected": "A skip list uses multiple layers of linked lists with probabilistic balancing, achieving O(log n) average operations without complex rotations."},
                {"text": "Explain the working of an LRU (Least Recently Used) cache.", "keywords": ["doubly linked list", "hashmap", "eviction", "O(1)"], "expected": "Combines a hashmap for O(1) lookup and a doubly linked list to track usage order for O(1) eviction/update."},
                {"text": "What is a Red-Black Tree and what are its properties?", "keywords": ["balanced", "binary search tree", "color", "rebalancing"], "expected": "A self-balancing BST where each node is red or black, ensuring the path from root to leaf is never more than twice the shortest path."},
                {"text": "Explain the Fenwick Tree (Binary Indexed Tree).", "keywords": ["prefix sum", "update", "O(log n)", "efficiency"], "expected": "A data structure that provides efficient methods for calculation and manipulation of prefix sums of a frequency table."},
            ],
        },
        "algorithms": {
            "easy": [
                {"text": "What is the time complexity of binary search and when can it be applied?", "keywords": ["O(log n)", "sorted", "divide", "midpoint"], "expected": "Binary search has O(log n) complexity and requires a sorted array. It repeatedly divides the search space by comparing with the midpoint."},
                {"text": "Explain bubble sort and its time complexity.", "keywords": ["O(n²)", "swaps", "adjacent", "passes"], "expected": "Bubble sort compares adjacent elements and swaps if out of order. O(n²) average/worst, O(n) best case."},
                {"text": "What is the difference between recursion and iteration?", "keywords": ["base case", "stack", "loop", "efficiency"], "expected": "Recursion calls a function within itself with a base case; iteration uses loops. Recursion is often cleaner but can lead to stack overflow."},
                {"text": "Explain Linear Search.", "keywords": ["O(n)", "sequential", "unsorted"], "expected": "Checks every element in the list until the target is found. Useful for small or unsorted datasets."},
            ],
            "medium": [
                {"text": "Explain Dijkstra's algorithm and when to use it vs Bellman-Ford.", "keywords": ["shortest path", "non-negative weights", "priority queue", "negative edges"], "expected": "Dijkstra: O((V+E) log V) with non-negative weights. Bellman-Ford handles negative weights in O(VE)."},
                {"text": "How does QuickSort work? What is its average and worst-case complexity?", "keywords": ["pivot", "partition", "O(n log n)", "O(n²)", "in-place"], "expected": "QuickSort partitions around a pivot recursively. Average O(n log n), worst O(n²) when pivot is always min/max."},
                {"text": "Explain the concept of Sliding Window and give an example.", "keywords": ["subarray", "substring", "O(n)", "pointers"], "expected": "Maintains a window of elements to solve subarray/substring problems in O(n) time instead of O(n²)."},
                {"text": "Explain Merge Sort and its time complexity.", "keywords": ["divide and conquer", "O(n log n)", "stable", "extra space"], "expected": "Recursively splits the array in half, sorts, and merges. O(n log n) and is a stable sort."},
                {"text": "What is Topological Sort?", "keywords": ["DAG", "dependencies", "DFS", "indegree"], "expected": "A linear ordering of vertices in a Directed Acyclic Graph such that for every edge uv, u comes before v."},
            ],
            "hard": [
                {"text": "Explain the concept of amortized analysis with an example.", "keywords": ["amortized", "potential function", "aggregate", "dynamic array", "O(1)"], "expected": "Amortized analysis averages cost over sequences. Example: dynamic array doubling has O(1) amortized insertion despite occasional O(n) resize."},
                {"text": "Explain the A* search algorithm and how it uses heuristics.", "keywords": ["shortest path", "g(n)", "h(n)", "f(n)", "admissible"], "expected": "A* uses f(n) = g(n) + h(n) where g is cost to reach node and h is estimated cost to goal. If h is admissible, it finds the shortest path."},
                {"text": "What is the Floyd-Warshall algorithm?", "keywords": ["all-pairs shortest path", "O(n³)", "dynamic programming"], "expected": "An algorithm for finding shortest paths in a weighted graph with positive or negative edge weights (but no negative cycles)."},
                {"text": "Explain the KMP (Knuth-Morris-Pratt) algorithm.", "keywords": ["string matching", "prefix function", "O(n+m)"], "expected": "Efficient string matching algorithm that avoids re-checking characters by using a prefix table."},
            ],
        },
        "system-design": {
            "medium": [
                {"text": "Design a URL shortening service like bit.ly.", "keywords": ["base62", "hash", "database", "redirect", "analytics", "load balancer"], "expected": "Use base62 encoding, a NoSQL database for mappings, CDN for fast redirects, and analytics tracking."},
                {"text": "How would you design a distributed cache system?", "keywords": ["Redis", "consistent hashing", "eviction", "LRU", "replication"], "expected": "Consistent hashing for key distribution, LRU eviction, master-slave replication, cache-aside pattern."},
                {"text": "What is Load Balancing and what are some common strategies?", "keywords": ["round robin", "least connections", "sticky sessions", "health checks"], "expected": "Distributes traffic across servers. Strategies include Round Robin, Least Connections, and IP Hash."},
                {"text": "Explain the concept of Microservices vs Monolith.", "keywords": ["scalability", "deployment", "loose coupling", "complexity"], "expected": "Monolith is a single unit; microservices are a collection of small, independent services. Microservices offer better scalability but higher operational complexity."},
                {"text": "What is Database Sharding?", "keywords": ["horizontal scaling", "partitioning", "shard key", "distribution"], "expected": "Splitting a large database into smaller, faster, more easily managed parts called shards."},
            ],
            "hard": [
                {"text": "Design a real-time collaborative document editing system like Google Docs.", "keywords": ["operational transformation", "CRDT", "WebSocket", "conflict resolution"], "expected": "Use OT or CRDTs for conflict resolution, WebSockets for real-time sync, vector clocks for versioning."},
                {"text": "Design a global-scale social media feed system for 1 billion users.", "keywords": ["fan-out", "sharding", "celebrity problem", "cache", "eventual consistency"], "expected": "Fan-out on write for regular users, fan-out on read for celebrities. Shard by user ID, cache hot feeds, use CDN."},
                {"text": "How would you design a Payment System with high consistency?", "keywords": ["idempotency", "distributed transactions", "reconciliation", "ACID"], "expected": "Use idempotency keys to prevent double-charging, distributed transactions (2PC/Saga), and daily reconciliation jobs."},
                {"text": "Design a distributed message queue like Kafka.", "keywords": ["partitions", "offsets", "replication", "pub/sub", "log-structured"], "expected": "Use log-structured storage, partitioned topics for parallelism, and consumer groups with offsets."},
                {"text": "Explain the design of a Content Delivery Network (CDN).", "keywords": ["edge servers", "latency", "caching", "DNS routing"], "expected": "Geographically distributed network of proxy servers that cache content closer to users to reduce latency."},
            ],
        },
        "javascript": {
            "easy": [
                {"text": "What is the difference between == and === in JavaScript?", "keywords": ["type coercion", "strict equality", "loose equality"], "expected": "== performs type coercion before comparison. === checks both value and type without coercion. Always prefer ===."},
                {"text": "Explain event bubbling and event capturing in JavaScript.", "keywords": ["propagation", "target", "bubble", "capture", "stopPropagation"], "expected": "Bubbling propagates from child to parent. Capturing from parent to child. Default is bubble. stopPropagation() halts propagation."},
                {"text": "What is Hoisting in JavaScript?", "keywords": ["declaration", "initialization", "var", "let", "const"], "expected": "JavaScript moves declarations to the top of their scope. var is hoisted and initialized as undefined, let/const are hoisted but not initialized."},
                {"text": "What are template literals in JS?", "keywords": ["backticks", "interpolation", "multiline"], "expected": "Backtick-delimited strings allowing multiline text and variable interpolation with ${}."},
            ],
            "medium": [
                {"text": "Explain the JavaScript event loop and how it handles asynchronous operations.", "keywords": ["call stack", "event loop", "task queue", "microtask", "Promise"], "expected": "The event loop monitors the call stack and task queue. Microtasks (Promises) have higher priority than macrotasks (setTimeout)."},
                {"text": "What are Promises and how do they differ from callbacks?", "keywords": ["then", "catch", "async/await", "callback hell", "chaining"], "expected": "Promises represent future values with .then()/.catch() chaining, solving callback hell. async/await is syntactic sugar."},
                {"text": "What is 'closure' and can you provide a practical use case?", "keywords": ["outer scope", "inner function", "private variables", "encapsulation"], "expected": "A function that retains access to its outer scope variables. Used for data privacy and function factories."},
                {"text": "Explain the 'this' keyword and how its value is determined.", "keywords": ["context", "bind", "call", "apply", "arrow functions"], "expected": "Determined by how a function is called. Arrow functions inherit 'this' from their lexical scope."},
                {"text": "What is the prototype chain in JavaScript?", "keywords": ["inheritance", "__proto__", "constructor", "objects"], "expected": "Mechanism where objects inherit features from one another. Every object has a prototype object it can look up properties on."},
            ],
        },
        "react": {
            "medium": [
                {"text": "Explain the React virtual DOM and how reconciliation works.", "keywords": ["diffing", "virtual DOM", "reconciliation", "Fiber", "keys"], "expected": "React diffs virtual DOM changes on state updates and applies minimal real DOM changes. Keys help track list items."},
                {"text": "What are React hooks and why were they introduced?", "keywords": ["useState", "useEffect", "class components", "reuse", "lifecycle"], "expected": "Hooks let functional components use state/lifecycle features, enable logic reuse without HOCs, introduced in React 16.8."},
                {"text": "Explain the difference between useEffect and useLayoutEffect.", "keywords": ["rendering", "painting", "blocking", "asynchronous"], "expected": "useEffect runs after paint; useLayoutEffect runs synchronously after DOM mutations but before paint."},
                {"text": "What is the purpose of React.memo()?", "keywords": ["memoization", "performance", "props", "re-render"], "expected": "A higher-order component that prevents re-rendering a functional component if its props haven't changed."},
                {"text": "Explain the Context API and when to use it.", "keywords": ["prop drilling", "global state", "provider", "consumer"], "expected": "Allows sharing state across the component tree without manually passing props through every level."},
            ],
        },
    },
    "behavioral": {
        "general": {
            "easy": [
                {"text": "Tell me about yourself and why you're interested in this role.", "keywords": ["experience", "skills", "passion", "goals", "background"], "expected": "Cover professional background, key skills, relevant achievements, and specific reasons for interest in this role."},
                {"text": "What is your greatest professional strength?", "keywords": ["specific", "example", "impact", "quantified", "relevant"], "expected": "Choose a relevant strength, provide a specific example, quantify the impact, and connect to the position."},
                {"text": "Why should we hire you?", "keywords": ["value", "skills", "culture", "results", "unique"], "expected": "Explain how your unique skills and experience will solve the company's problems and fit their culture."},
                {"text": "What are your weaknesses?", "keywords": ["honesty", "self-improvement", "actionable", "positive"], "expected": "Mention a real but manageable weakness and, more importantly, the steps you've taken to improve it."},
            ],
            "medium": [
                {"text": "Tell me about a time you faced a significant technical challenge. How did you resolve it?", "keywords": ["STAR", "problem", "solution", "impact", "learning"], "expected": "Use STAR: the technical challenge, action taken, result achieved, and lesson learned."},
                {"text": "Describe a situation where you had a conflict with a team member. How did you handle it?", "keywords": ["communication", "empathy", "resolution", "compromise", "outcome"], "expected": "Describe the conflict, your approach to understanding both perspectives, constructive resolution, and positive outcome."},
                {"text": "Tell me about a time you had to lead a project or team.", "keywords": ["leadership", "delegation", "impact", "results", "mentorship"], "expected": "Focus on how you organized tasks, motivated others, and achieved the goal."},
                {"text": "How do you prioritize your work when you have multiple competing deadlines?", "keywords": ["organization", "impact vs effort", "communication", "time management"], "expected": "Discuss using tools (Jira/Trello), evaluating business impact, and communicating early with stakeholders."},
            ],
            "hard": [
                {"text": "Describe a time when you had to make a difficult technical decision with incomplete information.", "keywords": ["risk assessment", "data-driven", "stakeholders", "hypothesis", "iterate"], "expected": "Explain the context, how you gathered data, your evaluation framework, stakeholder communication, and how you adjusted."},
                {"text": "Tell me about a time you failed and what you learned from it.", "keywords": ["accountability", "learning", "growth mindset", " STAR"], "expected": "Pick a genuine failure, take full responsibility, and focus heavily on the specific improvements you made as a result."},
            ],
        },
    },
    "coding": {
        "arrays": {
            "easy": [
                {"text": "Given an array of integers, find the two numbers that add up to a target sum.", "keywords": ["hashmap", "O(n)", "complement", "two sum"], "expected": "Use a hashmap: for each element check if target-element exists. O(n) time, O(n) space.", "code_template": "def two_sum(nums, target):\n    # Your solution here\n    pass"},
                {"text": "Reverse an array in place without using extra space.", "keywords": ["two pointers", "swap", "O(n)", "in-place"], "expected": "Two pointers from both ends, swap until they meet. O(n) time, O(1) space.", "code_template": "def reverse_array(arr):\n    # Your solution here\n    pass"},
                {"text": "Find the maximum and minimum elements in an array.", "keywords": ["loop", "comparison", "O(n)"], "expected": "Single pass tracking min and max. O(n)."},
            ],
            "medium": [
                {"text": "Find the maximum subarray sum (Kadane's algorithm).", "keywords": ["dynamic programming", "local max", "global max", "O(n)"], "expected": "Track current_max and global_max. current_max = max(el, current_max + el). O(n).", "code_template": "def max_subarray(nums):\n    # Your solution here\n    pass"},
                {"text": "Merge Intervals: Given a collection of intervals, merge all overlapping intervals.", "keywords": ["sorting", "overlap", "merging", "intervals"], "expected": "Sort by start time, then merge overlaps iteratively."},
                {"text": "Find the 'Kth' largest element in an array.", "keywords": ["heap", "quickselect", "O(n log k)", "O(n)"], "expected": "Use a min-heap of size k or the Quickselect algorithm for O(n) average time."},
            ],
        },
    },
}

COMPANIES = {
    "google":    ["algorithmic complexity", "system design at scale", "data structures optimization", "distributed systems"],
    "amazon":    ["leadership principles", "system design", "object-oriented design", "scalability"],
    "microsoft": ["algorithms", "object-oriented design", "behavioral", "system design"],
    "meta":      ["product sense", "algorithms", "system design", "behavioral"],
    "startup":   ["full-stack", "system design basics", "product thinking", "quick execution"],
}


def _pick_from_bank(question_type: str, difficulty: str, category: str, previous: List[str]) -> Optional[dict]:
    """Return a random question from the static bank, or None if nothing matches."""
    type_questions = QUESTION_BANK.get(question_type, QUESTION_BANK.get("technical", {}))
    matching_cat = None
    for cat_key in type_questions:
        if category in cat_key or cat_key in category:
            matching_cat = cat_key
            break
    if not matching_cat:
        if type_questions:
            matching_cat = random.choice(list(type_questions.keys()))
        else:
            return None

    cat_q = type_questions[matching_cat]
    diff_q = cat_q.get(difficulty) or cat_q.get("medium") or (list(cat_q.values())[0] if cat_q else [])
    if not diff_q:
        return None

    available = [q for q in diff_q if q["text"] not in previous] or diff_q
    return random.choice(available)


@router.post("/generate-question")
async def generate_question(request: GenerateQuestionRequest):
    """Generate an adaptive interview question — AI first, static bank fallback."""

    q_type     = request.type.lower()
    difficulty = request.difficulty.lower()
    category   = request.category.lower()
    company    = request.company
    job_desc   = request.job_description
    previous   = list(request.previous_questions or [])
    print(f"DEBUG: Generating {q_type} ({difficulty}) question. Previous: {len(previous)}")
    if previous:
        print(f"DEBUG: Last previous question: {previous[-1][:50]}...")

    time_limits = {"easy": 120, "medium": 180, "hard": 300}

    # ── Try AI generation first ──────────────────────────────────────────────
    ai_q = await ai_generate_question(
        q_type=request.type,
        difficulty=request.difficulty,
        category=request.category,
        company=request.company,
        job_description=request.job_description,
        resume_text=request.resume_text,
        previous_questions=request.previous_questions,
        ai_settings=request.ai_settings
    )

    if ai_q:
        company_ctx = ""
        if company:
            focus_areas = COMPANIES.get(company.lower(), [])
            if focus_areas:
                company_ctx = f" (Focus: {random.choice(focus_areas)})"

        return {
            "id":                  str(uuid.uuid4()),
            "text":                ai_q["text"] + company_ctx,
            "type":                q_type,
            "difficulty":          difficulty,
            "category":            category.replace("-", " ").title(),
            "expected_answer":     ai_q.get("expected_answer", ""),
            "keywords":            ai_q.get("keywords", []),
            "code_template":       ai_q.get("code_template"),
            "time_limit":          time_limits.get(difficulty, 180),
            "follow_up_questions": ai_q.get("follow_up_questions", [
                "Can you explain your time complexity?",
                "How would you optimise this solution?",
            ]),
            "company_focus": company,
            "ai_generated": True,
        }

    # ── Static bank fallback ─────────────────────────────────────────────────
    selected = _pick_from_bank(q_type, difficulty, category, previous)
    if not selected:
        selected = {
            "text": "Explain the concept of object-oriented programming and its four main principles.",
            "expected": "OOP has four principles: Encapsulation, Inheritance, Polymorphism, and Abstraction.",
            "keywords": ["encapsulation", "inheritance", "polymorphism", "abstraction"],
        }

    company_ctx = ""
    if company:
        focus_areas = COMPANIES.get(company.lower(), [])
        if focus_areas:
            company_ctx = f" (Focus: {random.choice(focus_areas)})"

    follow_ups = (
        ["Can you explain your time complexity?", "How would you optimise this?", "What are the edge cases?"]
        if q_type == "coding"
        else ["Can you give a specific example?", "How would you approach this differently with more time?"]
    )

    return {
        "id":                  str(uuid.uuid4()),
        "text":                selected["text"] + company_ctx,
        "type":                q_type,
        "difficulty":          difficulty,
        "category":            category.replace("-", " ").title(),
        "expected_answer":     selected.get("expected", ""),
        "keywords":            selected.get("keywords", []),
        "code_template":       selected.get("code_template"),
        "time_limit":          time_limits.get(difficulty, 180),
        "follow_up_questions": follow_ups,
        "company_focus":       company,
        "ai_generated":        False,
    }
