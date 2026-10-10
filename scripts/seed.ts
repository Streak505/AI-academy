import mongoose from "mongoose";
import dotenv from "dotenv";
import { Category } from "../src/models/Category";
import { Instructor } from "../src/models/Instructor";
import { Course } from "../src/models/Course";
import { Lesson } from "../src/models/Lesson";
import { Quiz } from "../src/models/Quiz";
import { Review } from "../src/models/Review";
import { News } from "../src/models/News";
import { Event } from "../src/models/Event";
import { Announcement } from "../src/models/Announcement";
import { Campus } from "../src/models/Campus";
import { User } from "../src/models/User";
import { connectToDatabase, describeMongoError, getMongoUri, getSafeDbInfo } from "../src/lib/db";
import { hashPassword } from "../src/lib/admin-auth";
import { configureDnsFromEnvironment } from "./configure-dns";

type SeedOptions = { production?: boolean };

export async function seedAcademyData({ production = false }: SeedOptions = {}) {
  const args = process.argv.slice(2);
  const { host, dbName } = getSafeDbInfo();

  console.log(`Seed target: ${host}/${dbName}`);
  if (!args.includes("--confirm")) {
    throw new Error("Seeding requires --confirm. No database changes were made.");
  }
  const uri = getMongoUri();
  const target = new URL(uri);
  const isLocal = ["localhost", "127.0.0.1"].includes(target.hostname.toLowerCase());
  if (!production && !process.env.ADMIN_PASSWORD?.trim()) {
    throw new Error("Missing ADMIN_PASSWORD. No database changes were made.");
  }
  if (production && isLocal) {
    throw new Error("Production seeding requires a remote MongoDB URI. No database changes were made.");
  }
  if (!production && !isLocal && !args.includes("--force-remote")) {
    throw new Error("Refusing to seed a remote database. Pass --force-remote to proceed.");
  }

  await connectToDatabase();

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection is not available");
  }

  if (!production) {
    const collections = [
      "users",
      "categories",
      "instructors",
      "courses",
      "lessons",
      "quizzes",
      "reviews",
      "news",
      "events",
      "announcements",
      "campuses",
    ];

    for (const collectionName of collections) {
      const collectionExists = await db.listCollections({ name: collectionName }).hasNext();
      if (collectionExists) {
        await db.collection(collectionName).deleteMany({});
      }
    }
  }

  const existingAdmin = await User.findOne({ email: "admin@aiacademy.pk" });
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  let adminUser = existingAdmin;
  if (!adminUser) {
    if (!adminPassword) throw new Error("Missing ADMIN_PASSWORD for creating the initial admin user.");
    adminUser = await User.findOneAndUpdate(
      { email: "admin@aiacademy.pk" },
      { $setOnInsert: {
        name: "Admin User",
        email: "admin@aiacademy.pk",
        passwordHash: await hashPassword(adminPassword),
        role: "ADMIN",
        phone: "+923001112233",
        isActive: true,
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  if (!adminUser) throw new Error("Could not create the initial admin user.");

  const instructorData = [
    {
      name: "Ayesha Khan",
      email: "ayesha.khan@aiacademy.pk",
      bio: "AI educator with experience in computer vision and applied machine learning projects.",
      specialization: "Machine Learning",
      qualification: "MS Computer Science",
      experience: "8 years",
      image: "/images/mentor/teacher1.png",
      socialLinks: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com",
      },
    },
    {
      name: "Usman Tariq",
      email: "usman.tariq@aiacademy.pk",
      bio: "Full-stack engineer helping learners connect theory to production-level systems.",
      specialization: "Web Development",
      qualification: "BS Software Engineering",
      experience: "7 years",
      image: "/images/mentor/teacher2.png",
      socialLinks: {
        linkedin: "https://linkedin.com",
        facebook: "https://facebook.com",
      },
    },
    {
      name: "Hina Shahid",
      email: "hina.shahid@aiacademy.pk",
      bio: "Data scientist focused on analytics, experimentation, and responsible AI practices.",
      specialization: "Data Science",
      qualification: "MPhil Data Science",
      experience: "6 years",
      image: "/images/mentor/teacher3.png",
      socialLinks: {
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      },
    },
  ];

  const instructors = await Promise.all(instructorData.map((instructor) =>
    Instructor.findOneAndUpdate(
      { email: instructor.email },
      { $setOnInsert: instructor },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
  ));

  const categories = await Promise.all([
    { name: "Artificial Intelligence", slug: "artificial-intelligence", description: "Foundations and practical AI systems building.", image: "/images/courses/ai.png" },
    { name: "Machine Learning", slug: "machine-learning", description: "Supervised and unsupervised model development.", image: "/images/courses/ml.png" },
    { name: "Python", slug: "python", description: "Python programming for problem solving and automation.", image: "/images/courses/web.png" },
    { name: "Data Science", slug: "data-science", description: "Analytical reasoning and decision support using data.", image: "/images/courses/data-science.png" },
    { name: "Web Development", slug: "web-development", description: "Modern front-end and back-end application creation.", image: "/images/courses/web.png" },
    { name: "Generative AI", slug: "generative-ai", description: "Prompt design, fine-tuning and AI product workflows.", image: "/images/courses/ai.png" },
  ].map((category) => Category.findOneAndUpdate(
    { slug: category.slug },
    { $setOnInsert: category },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));

  const aiCategory = categories.find((category) => category.slug === "artificial-intelligence");
  const mlCategory = categories.find((category) => category.slug === "machine-learning");
  const pythonCategory = categories.find((category) => category.slug === "python");
  const dsCategory = categories.find((category) => category.slug === "data-science");
  const webCategory = categories.find((category) => category.slug === "web-development");
  const genAiCategory = categories.find((category) => category.slug === "generative-ai");

  const courseData = [
    {
      title: "Artificial Intelligence Essentials",
      slug: "artificial-intelligence-essentials",
      shortDescription: "A practical foundation in AI concepts, problem solving, and intelligent system design.",
      description: "This comprehensive program introduces students to the principles of artificial intelligence, including reasoning, knowledge representation, search, planning, and real-world applications. Learners will work on guided projects and build a strong conceptual foundation for advanced AI study.",
      thumbnail: "/images/courses/ai.png",
      category: aiCategory?._id,
      instructor: instructors[0]._id,
      duration: "12 weeks",
      level: "Beginner",
      price: 45000,
      discountPrice: 38000,
      mode: "Hybrid",
      features: ["Project-based labs", "Real-world case studies", "Career mentoring"],
      syllabus: ["AI fundamentals", "Search and optimization", "Computer vision basics", "NLP overview", "AI workflow design"],
      lessons: [],
      isFeatured: true,
      isPublished: true,
    },
    {
      title: "Machine Learning Bootcamp",
      slug: "machine-learning-bootcamp",
      shortDescription: "Learn the practical workflow of data preparation, modeling, evaluation, and optimization.",
      description: "This bootcamp teaches learners how to build predictive models, evaluate performance, and prepare machine learning pipelines for production-ready tasks using Python and industry tools.",
      thumbnail: "/images/courses/ml.png",
      category: mlCategory?._id,
      instructor: instructors[0]._id,
      duration: "16 weeks",
      level: "Intermediate",
      price: 55000,
      discountPrice: 47000,
      mode: "Online",
      features: ["Hands-on model training", "Model evaluation", "Portfolio projects"],
      syllabus: ["Linear models", "Decision trees", "Feature engineering", "Validation strategies", "Deployment intro"],
      lessons: [],
      isFeatured: true,
      isPublished: true,
    },
    {
      title: "Python Programming for AI",
      slug: "python-programming-for-ai",
      shortDescription: "Develop strong Python foundations for AI, automation, and data workflows.",
      description: "Students learn Python from the ground up and immediately apply it to real automation, scripting, and data analysis tasks relevant to AI and data careers.",
      thumbnail: "/images/courses/web.png",
      category: pythonCategory?._id,
      instructor: instructors[1]._id,
      duration: "10 weeks",
      level: "Beginner",
      price: 32000,
      discountPrice: 26000,
      mode: "Onsite",
      features: ["Weekly coding tasks", "Python labs", "Mentor reviews"],
      syllabus: ["Variables and control flow", "Functions and modules", "File handling", "OOP basics", "Python for AI"],
      lessons: [],
      isFeatured: false,
      isPublished: true,
    },
    {
      title: "Data Science with Analytics",
      slug: "data-science-with-analytics",
      shortDescription: "Master data analysis, visualization, and insight generation for business decisions.",
      description: "This track equips learners with end-to-end data analysis workflows using Python, SQL, dashboards, and statistical reasoning to solve real business problems.",
      thumbnail: "/images/courses/data-science.png",
      category: dsCategory?._id,
      instructor: instructors[2]._id,
      duration: "14 weeks",
      level: "Intermediate",
      price: 52000,
      discountPrice: 44000,
      mode: "Hybrid",
      features: ["Dashboarding skills", "Practical analytics", "Capstone project"],
      syllabus: ["Statistics", "SQL basics", "Visualization", "Storytelling with data", "Analytical project"],
      lessons: [],
      isFeatured: true,
      isPublished: true,
    },
    {
      title: "Full Stack Web Development",
      slug: "full-stack-web-development",
      shortDescription: "Design and deploy responsive web applications with modern frameworks and backend systems.",
      description: "Learners build interactive web products using HTML, CSS, JavaScript, React, Node.js, and modern toolchains for production-grade experiences.",
      thumbnail: "/images/courses/web.png",
      category: webCategory?._id,
      instructor: instructors[1]._id,
      duration: "18 weeks",
      level: "Intermediate",
      price: 60000,
      discountPrice: 51000,
      mode: "Hybrid",
      features: ["Frontend and backend coverage", "Deployment guidance", "Portfolio building"],
      syllabus: ["HTML/CSS", "JavaScript", "React", "Node APIs", "Full-stack deployment"],
      lessons: [],
      isFeatured: true,
      isPublished: true,
    },
    {
      title: "Generative AI Studio",
      slug: "generative-ai-studio",
      shortDescription: "Explore generative AI workflows, prompt engineering, and AI product prototyping.",
      description: "Students learn how to prototype AI-powered experiences, evaluate output quality, and build practical generative AI workflows using modern tools.",
      thumbnail: "/images/courses/ai.png",
      category: genAiCategory?._id,
      instructor: instructors[0]._id,
      duration: "12 weeks",
      level: "Advanced",
      price: 68000,
      discountPrice: 56000,
      mode: "Online",
      features: ["Prompt engineering", "AI prototyping", "LLM workflows"],
      syllabus: ["LLM concepts", "Prompt design", "Retrieval systems", "AI product development", "Evaluation frameworks"],
      lessons: [],
      isFeatured: true,
      isPublished: true,
    },
  ];
  const courses = await Promise.all(courseData.map((course) => Course.findOneAndUpdate(
    { slug: course.slug },
    { $setOnInsert: course },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));

  const lessonSets = await Promise.all(
    courses.map((course) =>
      Promise.all([
        {
          course: course._id,
          title: `Module 1: Foundations of ${course.title}`,
          description: `Introductory sessions covering the foundations of ${course.title}.`,
          videoUrl: "https://example.com/video-1",
          duration: "18 min",
          order: 1,
          resources: ["Slides", "Note pack"],
          isPublished: true,
        },
        {
          course: course._id,
          title: `Module 2: Applied learning for ${course.title}`,
          description: `Applied exercises and learning routines for ${course.title}.`,
          videoUrl: "https://example.com/video-2",
          duration: "22 min",
          order: 2,
          resources: ["Hands-on workbook"],
          isPublished: true,
        },
      ].map((lesson) => Lesson.findOneAndUpdate(
        { course: course._id, title: lesson.title },
        { $setOnInsert: lesson },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )))
    )
  );

  for (let i = 0; i < courses.length; i += 1) {
    const courseId = courses[i]._id;
    const lessonIds = lessonSets[i].filter(Boolean).map((lesson) => lesson!._id);
    await Course.findByIdAndUpdate(courseId, { lessons: lessonIds });
  }

  const demoQuiz = await Quiz.findOneAndUpdate({ course: courses[0]._id, title: "AI Foundations Checkpoint" }, { $setOnInsert: {
    course: courses[0]._id,
    title: "AI Foundations Checkpoint",
    description: "Test your understanding of core AI concepts and practical decision-making.",
    questions: [
      {
        text: "Which of the following best describes supervised learning?",
        options: [
          "Learning by trial and error without labeled examples",
          "Training on labeled examples to predict outputs",
          "Finding hidden structure in unlabeled data",
          "Searching for the best route in a graph",
        ],
        correctAnswer: 1,
        explanation: "Supervised learning uses labeled examples to learn mappings from inputs to target outputs.",
      },
      {
        text: "What is the primary purpose of model evaluation?",
        options: [
          "To reduce the number of training examples",
          "To measure how well the model generalizes to unseen data",
          "To remove all invalid data points",
          "To convert code into machine-readable format",
        ],
        correctAnswer: 1,
        explanation: "Evaluation checks performance on unseen or validation data to estimate real-world effectiveness.",
      },
      {
        text: "Which practice is most important before deploying a machine learning model?",
        options: [
          "Skipping validation to save time",
          "Using the same data for training and evaluation",
          "Testing on representative data and checking performance metrics",
          "Hardcoding predictions without modeling",
        ],
        correctAnswer: 2,
        explanation: "Proper validation and measurement are essential to understand whether a model is ready for deployment.",
      },
    ],
    passingScore: 70,
    isPublished: true,
    createdBy: adminUser._id,
  } }, { upsert: true, new: true, setDefaultsOnInsert: true });

  if (!demoQuiz) throw new Error("Could not create the demo quiz.");
  await Course.findByIdAndUpdate(courses[0]._id, { quizzes: [demoQuiz._id] });

  await Promise.all([
    {
      student: adminUser._id,
      name: "Muhammad Ahmed",
      course: courses[0]._id,
      rating: 5,
      review: "The instructors explain difficult concepts in a very practical way and the projects felt career-ready.",
      avatar: "/images/testimonial/student1.png",
      isFeatured: true,
      isPublished: true,
    },
    {
      student: adminUser._id,
      name: "Sara Ali",
      course: courses[1]._id,
      rating: 5,
      review: "The learning environment is disciplined, supportive, and full of hands-on problem solving.",
      avatar: "/images/testimonial/student2.png",
      isFeatured: true,
      isPublished: true,
    },
    {
      student: adminUser._id,
      name: "Hamza Khan",
      course: courses[3]._id,
      rating: 4,
      review: "The course structure made analytics feel practical and easy to apply in real business scenarios.",
      avatar: "/images/mentor/user1.png",
      isFeatured: false,
      isPublished: true,
    },
  ].map((review) => Review.findOneAndUpdate(
    { name: review.name, course: review.course },
    { $setOnInsert: review },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));

  await Promise.all([
    {
      title: "AI Academy launches new Generative AI studio",
      slug: "ai-academy-launches-new-generative-ai-studio",
      excerpt: "A new studio focused on practical GPT workflows, experimentation and deployment.",
      content: "The latest studio helps students build and evaluate real AI products using modern tooling and guided mentorship.",
      image: "/images/courses/ai.png",
      author: adminUser._id,
      category: "Academy",
      tags: ["Generative AI", "Career", "Innovation"],
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      title: "Admissions open for fall AI cohorts",
      slug: "admissions-open-for-fall-ai-cohorts",
      excerpt: "Applications are now open for the next batch of AI, data science and web development students.",
      content: "Students can apply for focused academic tracks with scholarship opportunities and mentorship support.",
      image: "/images/banner/Hero.png",
      author: adminUser._id,
      category: "Admissions",
      tags: ["Admissions", "Scholarships"],
      isFeatured: true,
      isPublished: true,
      publishedAt: new Date(),
    },
  ].map((item) => News.findOneAndUpdate(
    { slug: item.slug },
    { $setOnInsert: item },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));

  await Promise.all([
    {
      title: "AI Career Fair 2026",
      description: "Meet leading tech organizations and learn about internships, placements and projects.",
      image: "/images/banner/Hero.png",
      date: new Date("2026-10-12T00:00:00.000Z"),
      startTime: "10:00 AM",
      endTime: "02:00 PM",
      location: "Lahore Campus",
      type: "Workshop",
      registrationUrl: "https://example.com/register",
      isPublished: true,
    },
    {
      title: "Prompt Engineering Masterclass",
      description: "A focused webinar exploring practical prompt design for AI workflows and business use cases.",
      image: "/images/courses/ai.png",
      date: new Date("2026-09-08T00:00:00.000Z"),
      startTime: "06:00 PM",
      endTime: "08:00 PM",
      location: "Online",
      type: "Webinar",
      registrationUrl: "https://example.com/webinar",
      isPublished: true,
    },
  ].map((item) => Event.findOneAndUpdate(
    { title: item.title, date: item.date },
    { $setOnInsert: item },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));

  await Promise.all([
    {
      title: "New intake announced",
      message: "The next AI Academy intake starts on 15 September 2026.",
      type: "Admission",
      priority: "High",
      isActive: true,
      expiresAt: new Date("2026-12-31T00:00:00.000Z"),
    },
    {
      title: "Workshop registration open",
      message: "Students can register for the data storytelling workshop before seats are filled.",
      type: "Event",
      priority: "Medium",
      isActive: true,
      expiresAt: new Date("2026-09-15T00:00:00.000Z"),
    },
  ].map((item) => Announcement.findOneAndUpdate(
    { title: item.title },
    { $setOnInsert: item },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));

  await Promise.all([
    {
      name: "AI Academy Lahore Campus",
      city: "Lahore",
      address: "Model Town Link Road, Lahore, Pakistan",
      phone: "+92 300 111 2233",
      email: "lahore@aiacademy.pk",
      image: "/images/banner/Hero.png",
      mapUrl: "https://maps.google.com",
      facilities: ["Smart classrooms", "AI lab", "Mentoring lounge"],
      isActive: true,
    },
  ].map((item) => Campus.findOneAndUpdate(
    { name: item.name, city: item.city },
    { $setOnInsert: item },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )));

  await mongoose.disconnect();
  console.log(`${production ? "Production" : "Development"} seed completed successfully`);
}

if (process.argv[1] && /(?:^|[\\/])seed\.ts$/.test(process.argv[1])) {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.local", override: true });
  configureDnsFromEnvironment();
  seedAcademyData().catch((error) => {
    if (error instanceof Error && /requires --confirm|Missing ADMIN_PASSWORD|Refusing to seed|requires a remote MongoDB URI/i.test(error.message)) {
      console.error(error.message);
      void mongoose.disconnect();
      process.exit(1);
    }
    const { code, message } = describeMongoError(error);
    console.error(`Seed failed [${code}]: ${message}`);
    void mongoose.disconnect();
    process.exit(1);
  });
}
