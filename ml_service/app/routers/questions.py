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
    user_profile: Dict = {}
    previous_questions: List[str] = []
    company: Optional[str] = None
    job_description: Optional[str] = None
    resume_text: Optional[str] = None
    ai_settings: Dict = {}


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
            ],
            "medium": [
                {"text": "Explain the difference between BFS and DFS graph traversal algorithms.", "keywords": ["queue", "stack", "level-order", "depth", "breadth"], "expected": "BFS uses a queue and explores level by level, ideal for shortest paths. DFS uses a stack and explores as deep as possible, ideal for topological sorting."},
                {"text": "What is a balanced binary search tree and why is it important?", "keywords": ["AVL", "Red-Black", "height", "O(log n)", "rotation"], "expected": "A balanced BST maintains O(log n) height ensuring O(log n) operations. Examples: AVL trees and Red-Black trees use rotations to maintain balance."},
                {"text": "How does a Trie (Prefix Tree) work and what are its common applications?", "keywords": ["prefix", "autocomplete", "search", "dictionary"], "expected": "A Trie stores characters in nodes to form words along paths. Common for autocomplete and dictionary searches."},
            ],
            "hard": [
                {"text": "Design a data structure that supports insert, delete, and getRandom in O(1) time.", "keywords": ["hashmap", "array", "index tracking", "swap"], "expected": "Use a hashmap for element-to-index mapping and an array for O(1) random access. For delete, swap target with last element, update map, and pop."},
                {"text": "Explain the implementation and trade-offs of a skip list.", "keywords": ["probabilistic", "O(log n)", "layers", "sentinel"], "expected": "A skip list uses multiple layers of linked lists with probabilistic balancing, achieving O(log n) average operations without complex rotations."},
                {"text": "Explain the working of an LRU (Least Recently Used) cache.", "keywords": ["doubly linked list", "hashmap", "eviction", "O(1)"], "expected": "Combines a hashmap for O(1) lookup and a doubly linked list to track usage order for O(1) eviction/update."},
            ],
        },
        "algorithms": {
            "easy": [
                {"text": "What is the time complexity of binary search and when can it be applied?", "keywords": ["O(log n)", "sorted", "divide", "midpoint"], "expected": "Binary search has O(log n) complexity and requires a sorted array. It repeatedly divides the search space by comparing with the midpoint."},
                {"text": "Explain bubble sort and its time complexity.", "keywords": ["O(n²)", "swaps", "adjacent", "passes"], "expected": "Bubble sort compares adjacent elements and swaps if out of order. O(n²) average/worst, O(n) best case."},
            ],
            "medium": [
                {"text": "Explain Dijkstra's algorithm and when to use it vs Bellman-Ford.", "keywords": ["shortest path", "non-negative weights", "priority queue", "negative edges"], "expected": "Dijkstra: O((V+E) log V) with non-negative weights. Bellman-Ford handles negative weights in O(VE)."},
                {"text": "How does QuickSort work? What is its average and worst-case complexity?", "keywords": ["pivot", "partition", "O(n log n)", "O(n²)", "in-place"], "expected": "QuickSort partitions around a pivot recursively. Average O(n log n), worst O(n²) when pivot is always min/max."},
                {"text": "Explain the concept of Sliding Window and give an example.", "keywords": ["subarray", "substring", "O(n)", "pointers"], "expected": "Maintains a window of elements to solve subarray/substring problems in O(n) time instead of O(n²)."},
            ],
            "hard": [
                {"text": "Explain the concept of amortized analysis with an example.", "keywords": ["amortized", "potential function", "aggregate", "dynamic array", "O(1)"], "expected": "Amortized analysis averages cost over sequences. Example: dynamic array doubling has O(1) amortized insertion despite occasional O(n) resize."},
                {"text": "Explain the A* search algorithm and how it uses heuristics.", "keywords": ["shortest path", "g(n)", "h(n)", "f(n)", "admissible"], "expected": "A* uses f(n) = g(n) + h(n) where g is cost to reach node and h is estimated cost to goal. If h is admissible, it finds the shortest path."},
            ],
        },
        "system-design": {
            "medium": [
                {"text": "Explain Load Balancing and what are some common strategies.", "keywords": ["round robin", "least connections", "sticky sessions", "health checks"], "expected": "Distributes traffic across servers. Strategies include Round Robin, Least Connections, and IP Hash."},
                {"text": "What is horizontal vs vertical scaling?", "keywords": ["scale up", "scale out", "nodes", "resources"], "expected": "Vertical scaling adds more power (CPU, RAM) to an existing machine. Horizontal scaling adds more machines to the pool of resources."},
                {"text": "Explain the concept of Microservices vs Monolith.", "keywords": ["scalability", "deployment", "loose coupling", "complexity"], "expected": "Monolith is a single unit; microservices are a collection of small, independent services. Microservices offer better scalability but higher operational complexity."},
            ],
            "hard": [
                {"text": "Design a real-time collaborative document editing system like Google Docs.", "keywords": ["operational transformation", "CRDT", "WebSocket", "conflict resolution"], "expected": "Use OT or CRDTs for conflict resolution, WebSockets for real-time sync, vector clocks for versioning."},
                {"text": "Explain the CAP theorem and its implications for distributed systems.", "keywords": ["consistency", "availability", "partition tolerance", "trade-offs"], "expected": "CAP theorem states that a distributed system can only guarantee two of three: Consistency, Availability, and Partition Tolerance."},
                {"text": "How would you design a rate-limiting system?", "keywords": ["token bucket", "leaky bucket", "sliding window", "distributed"], "expected": "Use algorithms like Token Bucket or Leaky Bucket. Implement using a distributed cache like Redis to track requests across multiple instances."},
            ]
        },
        "web-development": {
            "medium": [
                {"text": "Explain the React virtual DOM and how reconciliation works.", "keywords": ["diffing", "virtual DOM", "reconciliation", "Fiber", "keys"], "expected": "React diffs virtual DOM changes on state updates and applies minimal real DOM changes. Keys help track list items."},
                {"text": "What is the difference between client-side and server-side rendering?", "keywords": ["CSR", "SSR", "SEO", "performance", "hydration"], "expected": "SSR renders pages on the server for better SEO and initial load. CSR renders pages in the browser for faster subsequent interactions."},
            ],
            "hard": [
                {"text": "How does the browser event loop work?", "keywords": ["call stack", "task queue", "microtasks", "macrotasks", "non-blocking"], "expected": "The event loop continuously checks the call stack; if it's empty, it pushes tasks from the queue to the stack, prioritizing microtasks (promises) over macrotasks (setTimeout)."},
            ]
        },
        "python": {
            "easy": [
                {"text": "What is the difference between a list and a tuple in Python?", "keywords": ["mutable", "immutable", "performance", "parentheses", "brackets"], "expected": "Lists are mutable (changeable) and use []. Tuples are immutable and use (). Tuples are generally faster."},
                {"text": "How does memory management work in Python?", "keywords": ["garbage collection", "reference counting", "heap", "private", "management"], "expected": "Python uses automatic memory management with reference counting and a cycle-detecting garbage collector."},
            ],
            "medium": [
                {"text": "What are Python Decorators and how do they work?", "keywords": ["wrapper", "function", "closure", "meta-programming"], "expected": "Decorators are functions that wrap other functions to modify their behavior without changing the source code."},
                {"text": "Explain the difference between deep copy and shallow copy.", "keywords": ["copy", "deepcopy", "reference", "nested objects"], "expected": "Shallow copy creates a new object but references nested objects. Deep copy creates a new object and recursively copies all nested objects."},
            ],
            "hard": [
                {"text": "What is the Global Interpreter Lock (GIL) in Python and why does it exist?", "keywords": ["thread-safety", "parallelism", "CPU-bound", "reference counting"], "expected": "The GIL is a mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes at once."},
            ]
        },
        "javascript": {
            "easy": [
                {"text": "What is the difference between == and === in JavaScript?", "keywords": ["type coercion", "strict equality", "loose equality"], "expected": "== performs type coercion before comparison. === checks both value and type without coercion."},
            ],
            "medium": [
                {"text": "Explain the JavaScript event loop and how it handles asynchronous operations.", "keywords": ["call stack", "event loop", "task queue", "microtask", "Promise"], "expected": "The event loop monitors the call stack and task queue. Microtasks (Promises) have higher priority than macrotasks (setTimeout)."},
                {"text": "What is 'closure' and can you provide a practical use case?", "keywords": ["outer scope", "inner function", "private variables", "encapsulation"], "expected": "A function that retains access to its outer scope variables. Used for data privacy and function factories."},
            ],
        },
        "devops": {
            "medium": [
                {"text": "What is CI/CD and why is it important?", "keywords": ["continuous integration", "deployment", "automation", "pipeline"], "expected": "CI automates code integration; CD automates delivery/deployment. It ensures fast, reliable, and consistent releases."},
            ],
            "hard": [
                {"text": "Explain Kubernetes Architecture and its core components.", "keywords": ["kube-apiserver", "etcd", "scheduler", "kubelet", "control plane"], "expected": "Control plane (API server, etcd, scheduler, manager) manages the cluster; Nodes run Pods.", "hint": "Focus on the relationship between the control plane and the worker nodes."},
            ]
        }
    },
    "behavioral": {
        "general": {
            "easy": [
                {"text": "Tell me about yourself and why you're interested in this role.", "keywords": ["experience", "skills", "passion", "goals", "background"], "expected": "Cover professional background, key skills, relevant achievements, and specific reasons for interest in this role.", "hint": "Link your past achievements directly to the needs mentioned in the job description."},
                {"text": "What is your greatest professional strength?", "keywords": ["specific", "example", "impact", "quantified", "relevant"], "expected": "Choose a relevant strength, provide a specific example, quantify the impact, and connect to the position.", "hint": "Provide a concrete metric (e.g., 'reduced latency by 20%') to support your claim."},
            ],
            "medium": [
                {"text": "Tell me about a time you faced a significant technical challenge. How did you resolve it?", "keywords": ["STAR", "problem", "solution", "impact", "learning"], "expected": "Use STAR: the technical challenge, action taken, result achieved, and lesson learned."},
                {"text": "Describe a situation where you had a conflict with a team member. How did you handle it?", "keywords": ["communication", "empathy", "resolution", "compromise", "outcome"], "expected": "Describe the conflict, your approach to understanding both perspectives, constructive resolution, and positive outcome."},
            ],
            "hard": [
                {"text": "Tell me about a time you failed and what you learned from it.", "keywords": ["accountability", "learning", "growth mindset", "STAR"], "expected": "Pick a genuine failure, take full responsibility, and focus heavily on the specific improvements you made as a result."},
            ],
        },
    },
    "coding": {
        "logic": {
            "easy": [
                {"text": "Explain the difference between a list and a tuple in Python.", "keywords": ["mutable", "immutable", "performance"], "expected": "Lists are mutable and use square brackets; tuples are immutable and use parentheses."},
                {"text": "What is the time complexity of searching in a Hash Map?", "keywords": ["average case", "constant time", "O(1)", "hashing"], "expected": "O(1) on average, as keys are mapped directly to indices via a hash function."}
            ],
            "medium": [
                {"text": "How does a Binary Search Tree (BST) remain efficient?", "keywords": ["sorted", "logarithmic", "O(log n)", "recursion"], "expected": "BSTs keep elements sorted, allowing O(log n) search by eliminating half the search space at each step."}
            ]
        },
        "system-design": {
            "hard": [
                {"text": "How would you design a rate limiter for a high-traffic API?", "keywords": ["token bucket", "redis", "distributed", "sliding window"], "expected": "Use algorithms like Token Bucket or Sliding Window with a distributed cache like Redis to track user request counts across multiple servers."},
                {"text": "Explain the CAP theorem and how it affects system design choices.", "keywords": ["consistency", "availability", "partition tolerance", "trade-off"], "expected": "CAP theorem states a distributed system can only provide two of three: Consistency, Availability, and Partition Tolerance."}
            ]
        },
        "arrays": {
            "easy": [
                {"text": "Given an array of integers, find the two numbers that add up to a target sum.", "keywords": ["hashmap", "O(n)", "complement", "two sum"], "expected": "Use a hashmap: for each element check if target-element exists. O(n) time, O(n) space.", "code_template": "def two_sum(nums, target):\n    # Your solution here\n    pass"},
                {"text": "Reverse an array in place without using extra space.", "keywords": ["two pointers", "swap", "O(n)", "in-place"], "expected": "Two pointers from both ends, swap until they meet. O(n) time, O(1) space.", "code_template": "def reverse_array(arr):\n    # Your solution here\n    pass"},
            ],
            "medium": [
                {"text": "Find the maximum subarray sum (Kadane's algorithm).", "keywords": ["dynamic programming", "local max", "global max", "O(n)"], "expected": "Track current_max and global_max. current_max = max(el, current_max + el). O(n).", "code_template": "def max_subarray(nums):\n    # Your solution here\n    pass"},
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
