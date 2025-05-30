const httpMocks = require('node-mocks-http');
const { loginGetHandler, loginPostHandler, logoutHandler, signupGetHandler, signupPostHandler } = require('../controllers/authController');
const User = require('../models/user');
const Post = require('../models/post');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');
const { validationResult } = require('express-validator');

jest.mock('bcrypt');
jest.mock('../utils/jwt');
jest.mock('express-validator');

jest.mock('../models/user', () => {
  const originalModule = jest.requireActual('../models/user');
  return {
    ...originalModule,
    findOne: jest.fn(), 
    findById: jest.fn(), 
    prototype: {
      save: jest.fn() 
    }
  };
});

const mockQuery = {
  populate: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockResolvedValue([])
};

jest.mock('../models/post', () => ({
  find: jest.fn(() => mockQuery),
  countDocuments: jest.fn().mockResolvedValue(0)
}));

jest.spyOn(console, 'error').mockImplementation(() => {});

describe('GET /', () => {
  it('should render login page with default values', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    res.render = jest.fn();

    loginGetHandler(req, res);

    expect(res.render).toHaveBeenCalledWith('login', {
      errors: [],
      oldInput: {},
      generalError: null
    });
  });

  it('should handle template rendering errors', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    res.render = jest.fn().mockImplementation(() => {
      throw new Error('Render failed');
    });
    res.send = jest.fn();

    loginGetHandler(req, res);

    expect(res.send).toHaveBeenCalledWith("Something went wrong. Try again.");
    expect(console.error).toHaveBeenCalledWith("Error loading login page");
  });
});

describe('POST /login', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest({
      method: 'POST',
      url: '/login',
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
    });
    res = httpMocks.createResponse();
    res.render = jest.fn();
    res.cookie = jest.fn();
    res.redirect = jest.fn();
    res.status = jest.fn().mockReturnValue(res);
    res.send = jest.fn();
  });

  it('should render login with validation errors if input is invalid', async () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ msg: 'Username is required' }]
    });

    await loginPostHandler(req, res);

    expect(res.render).toHaveBeenCalledWith('login', {
      errors: [{ msg: 'Username is required' }],
      oldInput: req.body
    });
  });

  it('should render login with general error if user not found', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    User.findOne.mockResolvedValue(null);

    await loginPostHandler(req, res);

    expect(res.render).toHaveBeenCalledWith('login', {
      errors: [],
      oldInput: req.body,
      generalError: "Invalid email or password"
    });
  });

  it('should render login with general error if password is incorrect', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    User.findOne.mockResolvedValue({ _id: '123', password: 'hashedpassword' });
    bcrypt.compare.mockResolvedValue(false);

    await loginPostHandler(req, res);

    expect(res.render).toHaveBeenCalledWith('login', {
      errors: [],
      oldInput: req.body,
      generalError: "Invalid email or password"
    });
  });

  it('should set cookie and redirect on successful login', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    const mockUser = { _id: '123', password: 'hashedpassword' };
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    generateToken.mockReturnValue('mocktoken');

    await loginPostHandler(req, res);

    expect(res.cookie).toHaveBeenCalledWith('token', 'mocktoken', {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });
    expect(res.redirect).toHaveBeenCalledWith('/homepage');
  });

  it('should handle database errors', async () => {
    validationResult.mockReturnValue({ isEmpty: () => true });
    User.findOne.mockRejectedValue(new Error('Database connection failed'));

    await loginPostHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Server error during login");
  });
});

describe('GET /logout', () => {
  it('should clear cookie and redirect to login', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    res.clearCookie = jest.fn();
    res.redirect = jest.fn();

    logoutHandler(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('token');
    expect(res.redirect).toHaveBeenCalledWith('/login');
  });
});

describe('GET /signup', () => {
  it('should render signup page with default values', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    res.render = jest.fn();

    signupGetHandler(req, res);

    expect(res.render).toHaveBeenCalledWith('signup', {
      errors: [],
      oldInput: {},
      generalError: ""
    });
  });

  it('should handle template rendering errors', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    res.render = jest.fn().mockImplementation(() => {
      throw new Error('Render failed');
    });
    res.send = jest.fn();

    signupGetHandler(req, res);

    expect(res.send).toHaveBeenCalledWith("Something went wrong. Try again.");
    expect(console.error).toHaveBeenCalledWith("Error loading SignUp page:", expect.any(Error));
  });
});
