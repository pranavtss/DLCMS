const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let respData = '';
      res.on('data', (chunk) => {
        respData += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: respData ? JSON.parse(respData) : null
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  try {
    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'admin@dlcms',
      password: 'admin'
    });
    console.log('Login Status:', loginRes.status);
    console.log('Login Response:', loginRes.body);

    if (loginRes.status !== 200) {
      console.error('❌ Login failed');
      return;
    }

      const userId = loginRes.body.userId;
    console.log('Admin User ID:', userId);

    // Step 2: Create a course
    console.log('\n2. Creating a course...');
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
      userId: userId
    };

    const courseRes = await makeRequest('POST', '/api/courses', courseData);
    console.log('Course Creation Status:', courseRes.status);
    console.log('Course Response:', JSON.stringify(courseRes.body, null, 2));

      if (courseRes.status !== 200 && courseRes.status !== 201) {
      console.error('❌ Course creation failed');
      return;
    }

    const courseId = courseRes.body.course._id;
    console.log('Created Course ID:', courseId);

    // Step 3: Add a lesson
    console.log('\n3. Adding a lesson...');
    const lessonData = {
      title: 'intro',
      videoUrl: 'https://www.youtube.com/watch?v=bsfRV83GyVI',
      description: ''
    };

    const lessonRes = await makeRequest('POST', `/api/courses/${courseId}/lessons`, lessonData);
    console.log('Lesson Creation Status:', lessonRes.status);
    console.log('Lesson Response:', JSON.stringify(lessonRes.body, null, 2));

    if (lessonRes.status === 200) {
      console.log('✅ Successfully added lesson!');
    } else {
      console.error('❌ Failed to add lesson');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
