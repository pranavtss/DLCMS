const http = require('http');

// First, let's get all courses to find a valid course ID
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/courses',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Courses:', data);
    
    const courses = JSON.parse(data);
    if (courses.length > 0) {
      const courseId = courses[0]._id;
      console.log('Using course ID:', courseId);
      
      // Now test adding a lesson
      testAddLesson(courseId);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();

function testAddLesson(courseId) {
  const lessonData = {
    title: 'Test Lesson',
    videoUrl: 'https://www.youtube.com/watch?v=bsfRV83GyVI',
    description: 'Test description'
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
    console.log(`Status Code: ${res.statusCode}`);
    console.log('Response Headers:', res.headers);
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Response:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.write(JSON.stringify(lessonData));
  req.end();
}
