// Sample data for initial population
const sampleData = {
    features: [
        {
            title: "Advanced AI Mod",
            description: "Create an advanced AI modification system that allows users to customize AI behavior and responses.",
            votes: 15,
            status: "requested",
            added_by: "user",
            ai_core_comment: "Great idea! We're considering this for Q2 2024."
        },
        {
            title: "Real-time Collaboration",
            description: "Enable real-time collaboration features for multiple users working on the same project.",
            votes: 12,
            status: "roadmap",
            added_by: "user",
            ai_core_comment: "This is on our roadmap for next quarter."
        },
        {
            title: "Mobile App",
            description: "Develop a mobile application for iOS and Android platforms.",
            votes: 8,
            status: "watching",
            added_by: "user",
            ai_core_comment: "We're monitoring demand for this feature."
        }
    ],
    internal_work_items: [
        {
            title: "LLM as Judge Pipeline",
            description: "Building MLflow + automated evaluation pipeline for testing model outputs. This will help all teams validate their AI implementations with consistent, automated testing.",
            category: "evaluation",
            priority: "high",
            impact: "high",
            target_date: "Q2 2024",
            status: "in_progress",
            meeting_discussion: 1,
            updates: "Initial framework completed, working on integration with existing systems."
        },
        {
            title: "Code Assurance Archetypes",
            description: "Building testing frameworks for code generation and review capabilities. Ensuring AI Core can generate, review, and validate code across different programming languages and patterns.",
            category: "evaluation",
            priority: "medium",
            impact: "high",
            target_date: "Q3 2024",
            status: "research",
            meeting_discussion: 0,
            updates: "Research phase complete, starting implementation planning."
        }
    ],
    cohere_items: [
        {
            title: "API Rate Limiting Issue",
            description: "Users experiencing rate limiting errors when making multiple API calls in quick succession.",
            category: "bugs",
            status: "open",
            link: "https://github.com/cohere/api-issues/123",
            target_date: "Next week",
            meeting_discussion: 1,
            updates: "Identified the root cause, working on fix."
        },
        {
            title: "Enhanced Documentation",
            description: "Request for more comprehensive documentation with examples and tutorials.",
            category: "features",
            status: "under_investigation",
            link: "https://cohere.com/feedback/docs",
            target_date: "Q2 2024",
            meeting_discussion: 0,
            updates: "Gathering requirements from user feedback."
        }
    ]
};

module.exports = sampleData;
