const revenueModel = require('../models/revenueModel');

function getAllRevenues(req, res) {
  const revenues = revenueModel.getAllRevenues();
  res.json(revenues);
}

function getRevenueByMonth(req, res) {
  const month = req.params.month;
  const revenue = revenueModel.getRevenueByMonth(month);

  if (!revenue) {
    return res.status(404).json({ message: 'Revenue data not found for the specified month.' });
  }

  res.json(revenue);
}

function addRevenue(req, res) {
  const { month, amount } = req.body;

  if (!month || !amount) {
    return res.status(400).json({ message: 'Month and amount are required.' });
  }

  const newRevenue = revenueModel.addRevenue(month, amount);
  res.status(201).json(newRevenue);
}

module.exports = { getAllRevenues, getRevenueByMonth, addRevenue };