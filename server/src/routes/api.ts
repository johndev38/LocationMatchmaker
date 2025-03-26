import express from 'express';
import { protect } from '../middleware/auth';
import * as contractController from '../controllers/contractController';
import * as propertyOfferController from '../controllers/propertyOfferController';
import * as reservationController from '../controllers/reservationController';

const router = express.Router();

// Routes protégées nécessitant une authentification
router.use(protect);

// Routes pour les offres de propriété
router.put('/property-offers/:offerId/status', propertyOfferController.updateOfferStatus);

// Routes pour les contrats
router.post('/contracts', contractController.createContract);
router.get('/contracts', contractController.getUserContracts);
router.get('/contracts/:contractId', contractController.getContractById);

// Routes pour les réservations
router.post('/reservations', reservationController.createReservation);
router.get('/reservations', reservationController.getUserReservations);
router.get('/reservations/:reservationId', reservationController.getReservationById);
router.put('/reservations/:reservationId/status', reservationController.updateReservationStatus);
router.put('/reservations/:reservationId/payment-status', reservationController.updateReservationPaymentStatus);

export default router; 