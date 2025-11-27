const axios = require('axios');

const API_KEY = '2efd65c73f9e45468e8113557063155b.WJH3umRZTDrTqTbj';
const IMAGE_URL = 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400';

async function testGLM() {
  console.log('测试 GLM-4V-Flash API...\n');
  
  try {
    // GLM API 使用类似 OpenAI 的格式
    const response = await axios.post(
      'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      {
        model: 'glm-4v-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '这张图片里有什么动物？请详细描述。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: IMAGE_URL
                }
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );
    
    console.log('✅ GLM-4V API 测试成功！\n');
    console.log('分析结果:');
    console.log(response.data.choices[0].message.content);
  } catch (error) {
    console.error('❌ GLM-4V API 测试失败！');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('错误:', error.message);
    }
  }
}

testGLM();

