const express = require('express');
const axios = require('axios');
const router = express.Router();

// Get GitHub token from environment variables
const getGitHubToken = () => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN not set in environment variables');
  }
  return token;
};

// Create GitHub API client
const createGitHubClient = () => {
  const token = getGitHubToken();
  return axios.create({
    baseURL: 'https://api.github.com',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
};

// List repositories
router.get('/repos', async (req, res) => {
  try {
    const github = createGitHubClient();
    const response = await github.get('/user/repos');
    
    return res.json({
      status: 'success',
      repositories: response.data.map(repo => ({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        default_branch: repo.default_branch
      }))
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || error.message
    });
  }
});

// Get repository content
router.post('/content', async (req, res) => {
  const { owner, repo, path, ref } = req.body;
  
  if (!owner || !repo) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing owner or repo'
    });
  }
  
  try {
    const github = createGitHubClient();
    const url = `/repos/${owner}/${repo}/contents/${path || ''}`;
    const params = ref ? { ref } : {};
    
    const response = await github.get(url, { params });
    
    return res.json({
      status: 'success',
      content: response.data
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || error.message
    });
  }
});

// Create or update a file
router.post('/update', async (req, res) => {
  const { owner, repo, path, content, message, branch, sha } = req.body;
  
  if (!owner || !repo || !path || !content || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameters'
    });
  }
  
  try {
    const github = createGitHubClient();
    const url = `/repos/${owner}/${repo}/contents/${path}`;
    
    const contentEncoded = Buffer.from(content).toString('base64');
    
    const data = {
      message,
      content: contentEncoded,
      branch
    };
    
    // If sha is provided, it means we're updating an existing file
    if (sha) {
      data.sha = sha;
    }
    
    const response = await github.put(url, data);
    
    return res.json({
      status: 'success',
      content: response.data
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || error.message
    });
  }
});

// Create a pull request
router.post('/pr', async (req, res) => {
  const { owner, repo, title, body, head, base } = req.body;
  
  if (!owner || !repo || !title || !head || !base) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required parameters'
    });
  }
  
  try {
    const github = createGitHubClient();
    const url = `/repos/${owner}/${repo}/pulls`;
    
    const data = {
      title,
      body: body || '',
      head,
      base
    };
    
    const response = await github.post(url, data);
    
    return res.json({
      status: 'success',
      pull_request: {
        number: response.data.number,
        title: response.data.title,
        url: response.data.html_url
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;