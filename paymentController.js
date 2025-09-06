const Payment = require('../models/paymentModel');

exports.getPayments = async (req, res) => {
    try {
        const payments = await Payment.find();
        const updatedPayments = payments.map(payment => {
            const isOverdue = new Date(payment.dueDate) < new Date();
            payment.status = isOverdue ? 'overdue' : 'pending';
            return payment;
        });
        res.json(updatedPayments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payments', error });
    }
};

exports.getPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (payment) {
            payment.updateStatus();
            res.json(payment);
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payment', error });
    }
};

exports.createPayment = async (req, res) => {
    try {
        const newPayment = new Payment({
            name: req.body.name,
            amount: req.body.amount,
            dueDate: req.body.dueDate,
        });
        const savedPayment = await newPayment.save();
        res.status(201).json({
            message: 'Payment added successfully',
            payment: savedPayment,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error adding payment', error });
    }
};

exports.updatePayment = async (req, res) => {
    try {
        const updatedPayment = await Payment.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                amount: req.body.amount,
                dueDate: req.body.dueDate,
            },
            { new: true }
        );
        if (updatedPayment) {
            updatedPayment.updateStatus();
            await updatedPayment.save();
            res.json({
                message: 'Payment updated successfully',
                payment: updatedPayment,
            });
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment', error });
    }
};

exports.deletePayment = async (req, res) => {
    try {
        const deletedPayment = await Payment.findByIdAndDelete(req.params.id);
        if (deletedPayment) {
            res.json({ message: 'Payment deleted successfully', payment: deletedPayment });
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting payment', error });
    }
};