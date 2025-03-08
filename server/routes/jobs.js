// File: routes/jobs.js
const router = require('express').Router();
const Job = require('../models/Job');
const Bid = require('../models/Bid');
const { verifyToken, isClient, isFreelancer } = require('../middleware/auth');

// Create a new job (clients only)
router.post('/', verifyToken, isClient, async (req, res, next) => {
  try {
    const newJob = new Job({
      ...req.body,
      client: req.user.id
    });
    
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    next(err);
  }
});

// Get jobs posted by the current client
router.get('/my-jobs', verifyToken, isClient, async (req, res, next) => {
  try {
    const jobs = await Job.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .exec();
    
    res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
});

// Get all jobs (with filtering)
router.get('/', async (req, res, next) => {
  try {
    const { category, search, minBudget, maxBudget, sort } = req.query;
    
    const query = {};
    
    // Apply filters
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };
    if (minBudget || maxBudget) {
      if (minBudget) query['budget.min'] = { $gte: parseInt(minBudget) };
      if (maxBudget) query['budget.max'] = { $lte: parseInt(maxBudget) };
    }
    
    // Only show active jobs
    query.isActive = true;
    
    // Sort options
    let sortOption = {};
    if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'budget_low') sortOption = { 'budget.min': 1 };
    else if (sort === 'budget_high') sortOption = { 'budget.max': -1 };
    else sortOption = { createdAt: -1 }; // Default to newest
    
    const jobs = await Job.find(query)
      .sort(sortOption)
      .populate('client', 'username profileImage')
      .exec();
    
    res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
});

// Get a specific job
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client', 'username profileImage avgRating totalReviews')
      .exec();
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    res.status(200).json(job);
  } catch (err) {
    next(err);
  }
});


// Update a job (owner only)
router.put('/:id', verifyToken, isClient, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if user is the owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own jobs' });
    }
    
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.status(200).json(updatedJob);
  } catch (err) {
    next(err);
  }
});

// Delete a job (owner only)
router.delete('/:id', verifyToken, isClient, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if user is the owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own jobs' });
    }
    
    await Job.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
});


// Place a bid on a job (freelancers only)
router.post('/:id/bids', verifyToken, isFreelancer, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if freelancer already placed a bid
    const existingBid = await Bid.findOne({
      job: req.params.id,
      freelancer: req.user.id
    });
    
    if (existingBid) {
      return res.status(400).json({ message: 'You have already placed a bid on this job' });
    }
    
    const newBid = new Bid({
      job: req.params.id,
      freelancer: req.user.id,
      amount: req.body.amount,
      deliveryTime: req.body.deliveryTime,
      proposal: req.body.proposal
    });
    
    const savedBid = await newBid.save();
    
    // Update job's total bids count
    await Job.findByIdAndUpdate(req.params.id, {
      $inc: { totalBids: 1 }
    });
    
    res.status(201).json(savedBid);
  } catch (err) {
    next(err);
  }
});

// Get bids for the current user (freelancer only)
router.get('/my-bids', verifyToken, isFreelancer, async (req, res, next) => {
  try {
    const bids = await Bid.find({ freelancer: req.user.id })
      .populate('job')
      .sort({ createdAt: -1 })
      .exec();
    
    res.status(200).json(bids);
  } catch (err) {
    next(err);
  }
});

// Get all bids for a job (job owner only)
router.get('/:id/bids', verifyToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if user is the job owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only view bids for your own jobs' });
    }
    
    const bids = await Bid.find({ job: req.params.id })
      .populate('freelancer', 'username profileImage avgRating totalReviews')
      .sort({ createdAt: -1 })
      .exec();
    
    res.status(200).json(bids);
  } catch (err) {
    next(err);
  }
});


module.exports = router;