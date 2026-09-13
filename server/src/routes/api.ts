import { Router } from 'express';
import authRoutes from './authRoutes.js';
import patientRoutes from './patientRoutes.js';
import doctorRoutes from './doctorRoutes.js';
import consultationRoutes from './consultationRoutes.js';
import prescriptionRoutes from './prescriptionRoutes.js';
import labReportRoutes from './labReportRoutes.js';
import appointmentRoutes from './appointmentRoutes.js';
import auditRoutes from './auditRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/patients', patientRoutes);
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/consultations', consultationRoutes);
apiRouter.use('/prescriptions', prescriptionRoutes);
apiRouter.use('/lab-reports', labReportRoutes);
apiRouter.use('/appointments', appointmentRoutes);
apiRouter.use('/audit-logs', auditRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

export default apiRouter;
