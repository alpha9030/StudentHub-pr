// Pravio Notes Rich Database

const initialFolders = [
    { id: 'f-dsa', name: 'Data Structures & Algs', icon: 'git-branch' },
    { id: 'f-webdev', name: 'Web Development', icon: 'globe' },
    { id: 'f-langs', name: 'Programming Languages', icon: 'code' },
    { id: 'f-sql', name: 'Database & SQL', icon: 'database' }
];

const initialNotes = [];

const initialQuizzes = [
    {
        topic: 'JavaScript',
        question: 'Which console logs first?',
        options: ['setTimeout', 'Promise.resolve()', 'Synchronous execution'],
        answer: 2,
        explanation: 'Synchronous executions run straight inside the Call Stack and take priority over macrotasks (setTimeout) and microtasks (Promise).'
    },
    {
        topic: 'Sorting',
        question: 'Is Selection Sort an in-place sort?',
        options: ['Yes', 'No'],
        answer: 0,
        explanation: 'Selection Sort works in-place since it only swaps the minimum element into the active position, requiring O(1) extra space.'
    }
];

const initialFlashcards = [
    {
        category: 'Data Structures',
        question: 'Time complexity of Binary Search?',
        answer: 'O(log N), as it cuts the searchable range in half with each iteration step.',
        known: false
    },
    {
        category: 'Database Systems',
        question: 'What is ACID in SQL?',
        answer: 'Atomicity, Consistency, Isolation, and Durability - properties that guarantee transaction safety.',
        known: false
    }
];
