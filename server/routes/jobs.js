// File: routes/jobs.js
const router = require('express').Router();
const Job = require('../models/Job');
const Bid = require('../models/Bid');
const { verifyToken, isActiveClient , isActiveFreelancer } = require('../middleware/auth');

// Create a new job (clients only)
router.post('/', verifyToken, isActiveClient , async (req, res, next) => {
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
router.get('/my-jobs', verifyToken, isActiveClient , async (req, res, next) => {
  try {
    const jobs = await Job.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .exec();
    
    res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
});

// Get bids for the current user (freelancer only)
router.get('/my-bids', verifyToken, isActiveFreelancer , async (req, res, next) => {
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

router.patch('/:id/bids/:bidId/reject', verifyToken, isActiveClient , async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if user is the job owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage bids for your own jobs' });
    }
    
    const bid = await Bid.findById(req.params.bidId);
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    // Check if bid belongs to this job
    if (bid.job.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Bid does not belong to this job' });
    }
    
    // Update bid status to rejected
    bid.status = 'rejected';
    await bid.save();
    
    res.status(200).json({ message: 'Bid rejected successfully' });
  } catch (err) {
    next(err);
  }
});

// Get a specific user's bid on a job
router.get('/:id/my-bid', verifyToken, isActiveFreelancer , async (req, res, next) => {
  try {
    const bid = await Bid.findOne({
      job: req.params.id,
      freelancer: req.user.id
    });
    
    if (!bid) {
      return res.status(404).json({ message: 'No bid found for this job' });
    }
    
    res.status(200).json(bid);
  } catch (err) {
    next(err);
  }
});

// Reject a bid
router.patch('/:id/bids/:bidId/reject', verifyToken, isActiveClient , async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    // Check if user is job owner
    if (job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only manage bids for your own jobs' });
    }
    
    const bid = await Bid.findById(req.params.bidId);
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    // Check if bid belongs to the job
    if (bid.job.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Bid does not belong to this job' });
    }
    
    // Update bid status
    bid.status = 'rejected';
    await bid.save();
    
    res.status(200).json({ message: 'Bid rejected successfully', bid });
  } catch (err) {
    next(err);
  }
});

// Update order routes to create from bid
router.post('/from-bid/:bidId', verifyToken, isActiveClient , async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.bidId)
      .populate('job')
      .populate('freelancer');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    // Check if user is the job owner
    if (bid.job.client.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept bids for your own jobs' });
    }
    
    // Check if bid is pending
    if (bid.status !== 'pending') {
      return res.status(400).json({ message: `Bid is already ${bid.status}` });
    }
    
    // Create new order
    const newOrder = new Order({
      client: req.user.id,
      freelancer: bid.freelancer._id,
      job: bid.job._id,
      bid: bid._id,
      title: bid.job.title,
      description: bid.job.description,
      price: bid.amount,
      deliveryTime: bid.deliveryTime,
      deadline: bid.job.deadline || new Date(Date.now() + bid.deliveryTime * 24 * 60 * 60 * 1000)
    });
    
    const savedOrder = await newOrder.save();
    
    // Update bid status
    bid.status = 'accepted';
    await bid.save();
    
    // Set job's selected bid and mark as in progress
    await Job.findByIdAndUpdate(bid.job._id, {
      selectedBid: bid._id,
      status: 'in_progress',
      isActive: false
    });
    
    res.status(201).json(savedOrder);
  } catch (err) {
    next(err);
  }
});

// Get freelancer's own bid for a job
router.get('/:id/bids/my-bid', verifyToken, isActiveFreelancer , async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    
    const bid = await Bid.findOne({
      job: req.params.id,
      freelancer: req.user.id
    }).populate('freelancer', 'username profileImage avgRating');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    res.status(200).json(bid);
  } catch (err) {
    next(err);
  }
});

// Delete (withdraw) a bid (freelancer only)
router.delete('/:id/bids/:bidId', verifyToken, isActiveFreelancer , async (req, res, next) => {
  try {
    const bid = await Bid.findById(req.params.bidId);
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    // Check if user is the bid owner
    if (bid.freelancer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only withdraw your own bids' });
    }
    
    // Check if bid belongs to this job
    if (bid.job.toString() !== req.params.id) {
      return res.status(400).json({ message: 'Bid does not belong to this job' });
    }
    
    // Check if bid is still pending
    if (bid.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot withdraw bids that are already accepted or rejected' });
    }
    
    // Delete the bid
    await Bid.findByIdAndDelete(req.params.bidId);
    
    // Update job's bid count
    await Job.findByIdAndUpdate(req.params.id, {
      $inc: { totalBids: -1 }
    });
    
    res.status(200).json({ message: 'Bid withdrawn successfully' });
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
router.put('/:id', verifyToken, isActiveClient , async (req, res, next) => {
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
router.delete('/:id', verifyToken, isActiveClient , async (req, res, next) => {
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
router.post('/:id/bids', verifyToken, isActiveFreelancer , async (req, res, next) => {
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