const http = require('http');

// Create a test course first
const courseData = {
  title: "React Basics",
  description: "Learn the basics of React",
  instructor: "John Doe",
  category: "Programming",
  level: "Beginner",
  duration: "4 weeks",
  price: 49.99,
  originalPrice: 99.99,
  lessons: [],
  userId: "admin" // dummy for now, we'll get real userId
};

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/courses',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(JSON.stringify(courseData))
  }
};

const req = http.request(options, (res) => {
  let data = '';
  console.log(`Course Creation Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Course Response:', data);
    
    const response = JSON.parse(data);
    if (response.course) {
      const courseId = response.course._id;
      console.log('Created course with ID:', courseId);
      
      // Now test adding a lesson
      testAddLesson(courseId);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify(courseData));
req.end();

function testAddLesson(courseId) {
  const lessonData = {
    title: 'intro',
    videoUrl: 'https://www.youtube.com/watch?v=bsfRV83GyVI',
    description: ''
  };

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/courses/${courseId}/lessons`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify(lessonData))
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    console.log(`\nLesson Creation Status: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Lesson Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(JSON.stringify(lessonData));
  req.end();
}
