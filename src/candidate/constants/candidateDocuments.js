export const MAX_DOCUMENT_IMAGE_SIZE = 10 * 1024 * 1024

const imageTypes = ['image/jpeg', 'image/png']
const letterTypes = ['image/jpeg', 'image/png', 'application/pdf']
const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm']

const imageAccept = 'image/jpeg,image/png'
const letterAccept = 'image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf'
const videoAccept = 'video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm'

export const candidateDocumentTypes = [
  { key: 'updatedResume', label: 'Updated Resume' },
  { key: 'educationCertificates', label: 'All Education Certificates' },
  { key: 'experienceLetter', label: 'Experience Letter' },
  {
    key: 'salarySlip',
    label: 'Salary Slip / Bank Statement',
    description: 'Previous 6 months with highlighted salary'
  },
  {
    key: 'computerCourseCertificate',
    label: 'Computer Courses Certificate',
    description: 'MS-CIT, Tally, Typing, Auto-Cad, Catia'
  },
  { key: 'aadharCard', label: 'Aadhar Card' },
  { key: 'panCard', label: 'PAN Card' },
  { key: 'passportSizePhoto', label: 'Passport Size Photo' },
  { key: 'medicalFitnessCertificate', label: 'Medical Fitness Certificates' },
  {
    key: 'hamiPatra',
    label: 'HP - Hami Patra',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'concernLetter',
    label: 'CL - Concern Letter',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'selectedVideoFeedbackVideo',
    label: 'Selected Video / Feedback Video',
    description: 'MP4, MOV, or WebM video',
    accept: videoAccept,
    allowedTypes: videoTypes,
    typeMessage: 'only MP4, MOV, or WebM videos are allowed'
  },
  {
    key: 'candidatePhoto',
    label: 'Photo Of Candidates',
    description: 'With letter & receipt / formal photo',
    accept: imageAccept,
    allowedTypes: imageTypes,
    typeMessage: 'only JPG or PNG images are allowed'
  }
]

export const allowedDocumentImageTypes = new Set(imageTypes)
