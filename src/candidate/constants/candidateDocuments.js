export const MAX_DOCUMENT_IMAGE_SIZE = 10 * 1024 * 1024

const imageTypes = ['image/jpeg', 'image/png']
const letterTypes = ['image/jpeg', 'image/png', 'application/pdf']
const videoTypes = ['video/mp4', 'video/quicktime', 'video/webm']

const imageAccept = 'image/jpeg,image/png,.jpg,.jpeg,.png'
const letterAccept = 'image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf'
const videoAccept = 'video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm'

export const candidateDocumentTypes = [
  {
    key: 'updatedResume',
    label: 'Updated Resume',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'tenthCertificate',
    label: '10th Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'twelfthCertificate',
    label: '12th Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'graduateCertificate',
    label: 'Graduate Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'postGraduateCertificate',
    label: 'Post Graduate Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'experienceLetter',
    label: 'Experience Letter',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'salarySlip',
    label: 'Salary Slip',
    description: 'Previous 6 months with highlighted salary',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'bankStatement',
    label: 'Bank Statement',
    description: 'Previous 6 months with highlighted salary',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'msCitCertificate',
    label: 'MS-CIT Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'cccCertificate',
    label: 'CCC Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'advancedExcelCertificate',
    label: 'Advanced Excel Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'powerPointCertificate',
    label: 'PowerPoint Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'tallyCertificate',
    label: 'Tally Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'autoCadCertificate',
    label: 'AutoCAD Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'typingCertificate',
    label: 'Typing Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'catiaCertificate',
    label: 'CATIA Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'sapCertification',
    label: 'SAP Certification',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'cCppCertification',
    label: 'C/C++ Certification',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'computerCourseCertificate',
    label: 'Other Computer Course Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'otherCertificationCertificate',
    label: 'Other Certification Course Certificate',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'aadharCard',
    label: 'Aadhar Card',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'panCard',
    label: 'PAN Card',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'passportSizePhoto',
    label: 'Professional Photo Of Candidate',
    accept: imageAccept,
    allowedTypes: imageTypes,
    typeMessage: 'only JPG or PNG images are allowed'
  },
  {
    key: 'medicalFitnessCertificate',
    label: 'Medical Fitness Certificates',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  }
]

export const successDocumentTypes = [
  {
    key: 'candidatePhoto',
    label: 'Photo Of Candidate With Letter / Receipt',
    accept: imageAccept,
    allowedTypes: imageTypes,
    typeMessage: 'only JPG or PNG images are allowed'
  },
  {
    key: 'hamiPatra',
    label: 'Registration Declaration Form',
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
    key: 'selectedVideo',
    label: 'Selected Video / Feedback Video',
    accept: videoAccept,
    allowedTypes: videoTypes,
    typeMessage: 'only MP4, MOV, or WebM videos are allowed'
  },
  {
    key: 'jobJoiningHamiPatra',
    label: 'Job Joining Declaration Form',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  },
  {
    key: 'jobJoiningDocumentLetter',
    label: 'Job Joining Document Letter',
    accept: letterAccept,
    allowedTypes: letterTypes,
    typeMessage: 'only JPG, PNG, or PDF files are allowed'
  }
]

export const allCandidateDocumentTypes = [...candidateDocumentTypes, ...successDocumentTypes]

export const educationCertificateDocumentKeys = new Set([
  'tenthCertificate',
  'twelfthCertificate',
  'graduateCertificate',
  'postGraduateCertificate'
])

export const educationCertificateDocumentTypes = candidateDocumentTypes.filter((documentType) =>
  educationCertificateDocumentKeys.has(documentType.key)
)

export const educationCertificateLabel = (documentType) =>
  documentType.label

export const computerCourseDocumentKeys = new Set([
  'msCitCertificate',
  'cccCertificate',
  'advancedExcelCertificate',
  'powerPointCertificate',
  'tallyCertificate',
  'autoCadCertificate',
  'typingCertificate',
  'catiaCertificate',
  'sapCertification',
  'cCppCertification',
  'computerCourseCertificate',
  'otherCertificationCertificate'
])

export const computerCourseDocumentTypes = candidateDocumentTypes.filter((documentType) =>
  computerCourseDocumentKeys.has(documentType.key)
)

export const groupedCandidateDocumentKeys = new Set([
  ...educationCertificateDocumentKeys,
  ...computerCourseDocumentKeys
])

export const standaloneCandidateDocumentTypes = candidateDocumentTypes.filter(
  (documentType) => !groupedCandidateDocumentKeys.has(documentType.key)
)

export const allowedDocumentImageTypes = new Set(imageTypes)
