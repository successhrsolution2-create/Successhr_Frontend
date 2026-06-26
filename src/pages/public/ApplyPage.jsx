import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileImage,
  GraduationCap,
  Handshake,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  UserRound,
  X
} from 'lucide-react'
import api from '../../api/axios'
import {
  allowedDocumentImageTypes,
  computerCourseDocumentTypes,
  educationCertificateDocumentTypes,
  educationCertificateLabel,
  MAX_DOCUMENT_IMAGE_SIZE,
  standaloneCandidateDocumentTypes
} from '../../candidate/constants/candidateDocuments'

const hiddenApplyDocumentKeys = new Set(['candidatePhoto'])
const visibleApplyStandaloneDocumentTypes = standaloneCandidateDocumentTypes.filter(
  (documentType) => !hiddenApplyDocumentKeys.has(documentType.key)
)
const resumeCandidateDocumentType = visibleApplyStandaloneDocumentTypes.find((documentType) => documentType.key === 'updatedResume')
const otherCandidateDocumentTypes = visibleApplyStandaloneDocumentTypes.filter((documentType) => documentType.key !== 'updatedResume')

function createEmptySibling() {
  return {
    siblingName: '',
    siblingEducation: '',
    siblingMobileNumber: '',
    siblingDateOfBirth: '',
    siblingAge: '',
    siblingGender: '',
    siblingCareerProfile: '',
    siblingStudyStandard: '',
    siblingStudyStandardOther: '',
    siblingCareerProfileOther: ''
  }
}

function createEmptyCollegeReference() {
  return {
    instituteName: '',
    educationBranch: '',
    educationBranchOther: '',
    representativeName: '',
    designation: '',
    designationOther: '',
    mobileNumber: '',
    addressVillage: '',
    addressTaluka: '',
    addressDistrict: '',
    addressState: ''
  }
}

const initialForm = {
  candidateName: '',
  mobileNumber: '',
  whatsappNo: '',
  emailId: '',
  gender: '',
  currentAge: '',
  marriageStatus: '',
  aadhaarNo: '',
  panNo: '',
  dateOfBirth: '',
  currentAddress: '',
  permanentAddress: '',
  educationSector: '',
  educationSectorOther: '',
  educationBranch: '',
  educationBranchOther: '',
  computerCourse: '',
  computerCourseOther: '',
  englishTyping: false,
  hindiTyping: false,
  certificationCourse: '',
  certificationCourseOther: '',
  educationSpecialization: '',
  educationSpecializationOther: '',
  collegeName: '',
  collegeReferences: [createEmptyCollegeReference()],
  collegeEducationBranch: '',
  collegeEducationBranchOther: '',
  instituteDesignation: '',
  instituteDesignationOther: '',
  postGraduateInstituteName: '',
  postGraduateRepresentativeName: '',
  postGraduateEducationBranch: '',
  postGraduateEducationBranchOther: '',
  postGraduateDesignation: '',
  postGraduateDesignationOther: '',
  postGraduateMobileNumber: '',
  college12GraduateName: '',
  postGraduateCollegeName: '',
  collegeTeacherName: '',
  collegeCourseBranch: '',
  collegeCourseBranchOther: '',
  collegeDesignation: '',
  collegeMobileNumber: '',
  collegeReference: '',
  education: '',
  yearOfHigherEducation: '',
  computerCourses: '',
  otherAchievements: '',
  professorName: '',
  professorContactNumber: '',
  referenceBy: '',
  referenceContactNumber: '',
  referenceProfile: '',
  referenceProfileOther: '',
  referenceRelation: '',
  referenceRelationOther: '',
  referenceSourceOther: '',
  appliedFor: '',
  interestedDepartment: '',
  interestedDepartmentOther: '',
  lookingForField: '',
  preferredIndustry: '',
  preferredIndustryOther: '',
  industrySpecialization: '',
  industrySpecializationOther: '',
  preferredJobLocation: '',
  currentJobLocation: '',
  currentJobLocationOther: '',
  currentJobLocationMidcArea: '',
  currentJobLocationMidcAreaOther: '',
  availabilityForInterview: '',
  availabilityInterviewStartDate: '',
  availabilityInterviewEndDate: '',
  interviewMode: '',
  onlineInterviewMode: '',
  totalExperience: '',
  experienceDepartment: '',
  currentCompany: '',
  keySkillCategory: '',
  keySkillCategoryOther: '',
  keySkillItems: [],
  keySkillOther: '',
  keySkillsKnowledge: '',
  careerResponsibilityRole: '',
  careerResponsibilityRoleOther: '',
  careerJobResponsibilities: '',
  keyResponsibilities: '',
  netInHandSalary: '',
  grossSalaryPerMonth: '',
  ctcSalaryPerMonth: '',
  expectedNetInHandSalary: '',
  expectedGrossSalaryPerMonth: '',
  expectedCtcSalaryPerMonth: '',
  expectedSalaryNegotiable: '',
  currentSalary: '',
  expectedSalary: '',
  jobWorkingStatus: '',
  experienceType: '',
  noticePeriod: '',
  noticePeriodOther: '',
  careerSummary: '',
  reasonForJobChange: '',
  reasonForJobChangeOther: '',
  fatherOrHusbandName: '',
  fatherOccupation: '',
  fatherMobileNumber: '',
  motherOrWifeName: '',
  motherOccupation: '',
  motherMobileNumber: '',
  siblingName: '',
  siblingEducation: '',
  siblingMobileNumber: '',
  siblingDateOfBirth: '',
  siblingAge: '',
  siblingGender: '',
  siblingCareerProfile: '',
  siblingStudyStandard: '',
  siblingStudyStandardOther: '',
  siblingCareerProfileOther: '',
  siblings: [createEmptySibling()],
  feedback: '',
  suggestion: ''
}

const formSteps = [
  { title: 'Personal Details', icon: UserRound },
  { title: 'Education Details', icon: GraduationCap },
  { title: 'Professional Details', icon: BriefcaseBusiness },
  { title: 'Reference Success Details', icon: Handshake },
  { title: 'Documents', icon: FileImage }
]

const personalFields = [
  { name: 'candidateName', label: 'Candidate Name', required: true },
  { name: 'mobileNumber', label: 'Mobile Number', required: true, inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'whatsappNo', label: 'WhatsApp Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'emailId', label: 'Email ID', type: 'email' },
  { name: 'aadhaarNo', label: 'Aadhar Card Number', inputMode: 'numeric', maxLength: 12, digitsOnly: true },
  { name: 'panNo', label: 'PAN Number', maxLength: 10, uppercase: true },
  { name: 'dateOfBirth', label: 'DOB', type: 'date' },
  { name: 'currentAge', label: 'Current Age', type: 'number', readOnly: true }
]

const instituteReferenceFields = [
  { name: 'collegeName', label: 'College Name' },
  { name: 'collegeEducationBranch', label: 'College Education Branch', optionsFor: () => educationBranchOptions },
  { name: 'collegeEducationBranchOther', label: 'Other College Education Branch', showWhen: { name: 'collegeEducationBranch', value: 'Other' } },
  { name: 'professorName', label: 'College Representative Name' },
  { name: 'instituteDesignation', label: 'Designation', optionsFor: () => referenceDesignationOptions },
  { name: 'instituteDesignationOther', label: 'Other Designation', showWhen: { name: 'instituteDesignation', value: 'Other' } },
  { name: 'professorContactNumber', label: 'Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true }
]

const collegeReferenceFields = [
  { name: 'instituteName', label: 'College Name' },
  { name: 'educationBranch', label: 'College Education Branch', optionsFor: () => educationBranchOptions },
  { name: 'educationBranchOther', label: 'Other College Education Branch', showWhen: { name: 'educationBranch', value: 'Other' } },
  { name: 'representativeName', label: 'College Representative Name' },
  { name: 'designation', label: 'Designation', optionsFor: () => referenceDesignationOptions },
  { name: 'designationOther', label: 'Other Designation', showWhen: { name: 'designation', value: 'Other' } },
  { name: 'mobileNumber', label: 'Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'addressVillage', label: 'College Village' },
  { name: 'addressTaluka', label: 'College Taluka' },
  { name: 'addressDistrict', label: 'College District' },
  { name: 'addressState', label: 'College State' }
]

const postGraduateReferenceFields = [
  { name: 'postGraduateInstituteName', label: 'College Name' },
  { name: 'postGraduateEducationBranch', label: 'College Education Branch', optionsFor: () => educationBranchOptions },
  { name: 'postGraduateEducationBranchOther', label: 'Other College Education Branch', showWhen: { name: 'postGraduateEducationBranch', value: 'Other' } },
  { name: 'postGraduateRepresentativeName', label: 'College Representative Name' },
  { name: 'postGraduateDesignation', label: 'Designation', optionsFor: () => referenceDesignationOptions },
  { name: 'postGraduateDesignationOther', label: 'Other Designation', showWhen: { name: 'postGraduateDesignation', value: 'Other' } },
  { name: 'postGraduateMobileNumber', label: 'Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true }
]

const instituteCollegeFields = [
  { name: 'collegeTeacherName', label: 'Institute Representative Name' },
  { name: 'collegeCourseBranch', label: 'Course Branch', optionsFor: () => instituteCourseBranchOptions },
  { name: 'collegeCourseBranchOther', label: 'Other Course Branch', showWhen: { name: 'collegeCourseBranch', value: 'Other' } },
  { name: 'collegeDesignation', label: 'Designation' },
  { name: 'collegeMobileNumber', label: 'Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'collegeReference', label: 'Reference' }
]

const siblingCareerProfileOptions = ['', 'Studying', 'Own Business', 'Doing Government Job Preparation', 'Housewife', 'Farmer', 'Doing Government Job', 'Doing Private Job', 'Other']
const siblingStudyStandardOptions = [
  '',
  '1st Standard',
  '2nd Standard',
  '3rd Standard',
  '4th Standard',
  '5th Standard',
  '6th Standard',
  '7th Standard',
  '8th Standard',
  '9th Standard',
  '10th Standard',
  '11th Standard',
  '12th Standard',
  'Diploma',
  'Graduate',
  'PG',
  'Other'
]

const currentJobLocationTalukaOptions = ['', 'Sinnar', 'Nashik', 'Mumbai', 'Pune', 'Sangamner', 'Ahilyanagar', 'Sambhaji Nagar', 'Other']
const currentJobLocationMidcAreaOptions = ['', 'Musalgaon', 'Malegaon', 'Ambad', 'Satpur', 'Other']

const currentSalaryFields = [
  { name: 'netInHandSalary', label: 'NET / In-hand Salary', inputMode: 'numeric' },
  { name: 'grossSalaryPerMonth', label: 'Gross Per Month', inputMode: 'numeric' },
  { name: 'ctcSalaryPerMonth', label: 'CTC Per Month', inputMode: 'numeric' },
  { name: 'currentJobLocation', label: 'Current Job Location (Taluka)', options: currentJobLocationTalukaOptions },
  { name: 'currentJobLocationOther', label: 'Other Current Job Location (Taluka)', showWhen: { name: 'currentJobLocation', value: 'Other' } },
  { name: 'currentJobLocationMidcArea', label: 'Current Job Location (MIDC Area)', options: currentJobLocationMidcAreaOptions },
  { name: 'currentJobLocationMidcAreaOther', label: 'Other MIDC Area', showWhen: { name: 'currentJobLocationMidcArea', value: 'Other' } },
  { name: 'preferredJobLocation', label: 'Preferred Job Location' }
]

const expectedSalaryFields = [
  { name: 'expectedNetInHandSalary', label: 'Expected NET / In-hand Salary', inputMode: 'numeric' },
  { name: 'expectedGrossSalaryPerMonth', label: 'Expected Gross Per Month', inputMode: 'numeric' },
  { name: 'expectedCtcSalaryPerMonth', label: 'Expected CTC Per Month', inputMode: 'numeric' },
  { name: 'expectedSalaryNegotiable', label: 'Expected Salary Negotiable', options: ['', 'Yes', 'No'] }
]

const familyFields = [
  { name: 'fatherOrHusbandName', label: 'Father / Husband Name' },
  { name: 'fatherOccupation', label: 'Father / Husband Occupation' },
  { name: 'fatherMobileNumber', label: 'Father / Husband Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'motherOrWifeName', label: 'Mother / Wife Name' },
  { name: 'motherOccupation', label: 'Mother / Wife Occupation' },
  { name: 'motherMobileNumber', label: 'Mother / Wife Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true }
]

const siblingFields = [
  { name: 'siblingName', label: 'Sibling / Brother / Sister Name' },
  { name: 'siblingEducation', label: 'Sibling / Brother / Sister Education' },
  { name: 'siblingMobileNumber', label: 'Sibling / Brother / Sister Mobile Number', inputMode: 'numeric', maxLength: 10, digitsOnly: true },
  { name: 'siblingDateOfBirth', label: 'Sibling / Brother / Sister DOB', type: 'date' },
  { name: 'siblingAge', label: 'Sibling / Brother / Sister Age', type: 'number', readOnly: true },
  { name: 'siblingGender', label: 'Sibling / Brother / Sister Gender', options: ['', 'Male', 'Female', 'Other'] },
  { name: 'siblingCareerProfile', label: 'Sibling / Brother / Sister Career Profile', options: siblingCareerProfileOptions },
  { name: 'siblingStudyStandard', label: 'Sibling / Brother / Sister Study Standard', options: siblingStudyStandardOptions, showWhen: { name: 'siblingCareerProfile', value: 'Studying' } },
  { name: 'siblingStudyStandardOther', label: 'Other Sibling / Brother / Sister Study Standard', showWhen: { name: 'siblingStudyStandard', value: 'Other' } },
  { name: 'siblingCareerProfileOther', label: 'Other Sibling / Brother / Sister Career Profile', showWhen: { name: 'siblingCareerProfile', value: 'Other' } }
]

const addressPartFields = [
  { name: 'addressLine', label: 'Flat No / House No, Society, Landmark', full: true },
  { name: 'village', label: 'Village' },
  { name: 'taluka', label: 'Taluka' },
  { name: 'district', label: 'District' },
  { name: 'state', label: 'State' }
]
const collegeAddressPartFields = addressPartFields.filter((field) => field.name !== 'addressLine')

const educationSectorOptions = ['', '10th', '12th', 'Graduate', 'PG', 'PHD', 'ITI', 'Diploma', 'Degree', 'Other']
const higherEducationYearOptions = ['', ...Array.from({ length: 67 }, (_, index) => String(new Date().getFullYear() + 4 - index))]
const educationBranchOptions = ['', 'Arts', 'Commerce', 'Science', 'Diploma/BE', 'Pharmacy', 'MBA', 'Nursing', 'ITI', 'Computer Application', 'Computer Science', 'Other']
const computerCourseOptions = ['', 'MS-CIT', 'CCC', 'Advanced Excel', 'PowerPoint', 'Tally', 'AutoCAD', 'Typing', 'Other']
const certificationCourseOptions = ['', 'Graphic Design', 'C++', 'Java', 'PHP', 'Python', 'Web Development', 'Digital Marketing', 'Data Analytics', 'Other']
const instituteCourseBranchOptions = ['', 'MS-CIT', 'Tally', 'Advanced Excel', 'Typing', 'DTP', 'Web Design', 'Programming', 'Digital Marketing', 'Other']
const educationSpecializationByBranch = {
  Arts: ['History', 'Geography', 'Political Science', 'Economics', 'Sociology', 'Psychology', 'Marathi', 'Hindi', 'English'],
  Commerce: ['Accounting', 'Finance', 'Banking', 'Taxation', 'Business Administration', 'Economics', 'Costing'],
  Science: ['Chemistry', 'Microbiology', 'Physics', 'Mathematics', 'Botany', 'Zoology', 'Biotechnology', 'Biochemistry', 'Electronics'],
  'Diploma/BE': ['Mechanical', 'Civil', 'Electrical', 'Electronics', 'Computer Science', 'Information Technology', 'Automobile', 'Production', 'Chemical'],
  Pharmacy: ['Pharmacy', 'B.Pharm', 'D.Pharm', 'Pharmacology', 'Pharmaceutical Chemistry'],
  MBA: ['Marketing', 'HR', 'Finance', 'Operations', 'Business Analytics', 'International Business'],
  Nursing: ['Nursing', 'GNM', 'ANM', 'B.Sc Nursing'],
  ITI: ['Fitter', 'Electrician', 'Welder', 'Turner', 'Machinist', 'COPA', 'Diesel Mechanic'],
  'Computer Application': ['BCA', 'MCA', 'Computer Application', 'Information Technology', 'Software Development'],
  'Computer Science': ['Computer Science', 'Information Technology', 'Data Science', 'Cyber Security', 'Artificial Intelligence']
}
const educationSpecializationOptionsForBranch = (branch) => (branch ? ['', ...(educationSpecializationByBranch[branch] || []), 'Other'] : [''])
const referenceDesignationOptions = ['', 'TPO', 'Other']
const preferredDepartmentOptions = ['', 'Accounts', 'Sales', 'Quality', 'HR', 'Admin', 'Production', 'Operations', 'Purchase', 'Store', 'Logistics', 'Dispatch', 'Customer Support', 'Marketing', 'Finance', 'IT', 'Design', 'Maintenance', 'Research & Development', 'Safety', 'Front Office', 'Back Office', 'Warehouse', 'Other']
const preferredIndustryOptions = ['', 'Manufacturing', 'Banking', 'Finance', 'Insurance', 'IT', 'Non IT', 'Services', 'Educational', 'Healthcare', 'Pharmaceutical', 'Automobile', 'FMCG', 'Retail', 'Real Estate', 'Construction', 'Logistics', 'Telecom', 'Hospitality', 'Textile', 'Chemical', 'Food Processing', 'E-commerce', 'Consulting', 'Other']
const industrySpecializationOptions = ['', 'Manufacturing', 'Food', 'Pharma', 'Polymer', 'FMCG', 'Chemical', 'Cosmetics', 'Plastic', 'Engineering', 'Automobile', 'Any Industry', 'Textile', 'Packaging', 'Electrical', 'Electronics', 'Agriculture', 'Healthcare', 'Construction', 'Logistics', 'Other']
const jobWorkingStatusOptions = ['', 'Working', 'Jobless']
const experienceTypeOptions = ['', 'Fresher', 'Experience']
const noticePeriodOptions = ['', 'Immediate Joiner', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'Other']
const interviewModeOptions = ['', 'Online', 'Offline', 'Face to Face']
const reasonForJobChangeOptions = ['', 'Looking for financial and personal growth', 'Looking for opportunity in native place', 'Facing challenge in current company', 'Any Other']
const careerResponsibilityRoleOptions = ['', 'Software Developer', 'Sales Executive', 'HR / Admin', 'Accounts Executive', 'Production Executive', 'Quality Inspector', 'Store / Purchase', 'Customer Support', 'Data Entry / Back Office', 'Digital Marketing Executive', 'Maintenance Technician', 'Other']
const keySkillCategoryOptions = ['', 'Programming Skills', 'Office Skills', 'Accounting Skills', 'Design Skills', 'Digital Marketing Skills', 'Mechanical / Technical Skills', 'Communication Skills', 'Other']
const keySkillOptionsByCategory = {
  'Programming Skills': ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'Java', 'Python', 'PHP', 'C++', 'SQL', 'Other'],
  'Office Skills': ['MS Word', 'MS Excel', 'Advanced Excel', 'PowerPoint', 'Email Writing', 'Data Entry', 'Typing', 'Other'],
  'Accounting Skills': ['Tally', 'GST', 'Invoice Billing', 'Bank Reconciliation', 'Payroll', 'Accounts Payable/Receivable', 'Other'],
  'Design Skills': ['Photoshop', 'CorelDRAW', 'Canva', 'Graphic Design', 'Video Editing', 'UI Design', 'Other'],
  'Digital Marketing Skills': ['SEO', 'Social Media Marketing', 'Google Ads', 'Meta Ads', 'Content Writing', 'Email Marketing', 'Other'],
  'Mechanical / Technical Skills': ['AutoCAD', 'CNC/VMC', 'Machine Operating', 'Quality Checking', 'Maintenance', 'Production Planning', 'Other'],
  'Communication Skills': ['English Communication', 'Marathi Communication', 'Hindi Communication', 'Customer Handling', 'Team Coordination', 'Presentation', 'Other']
}
const referenceSourceOptions = ['Social Media', 'Website', 'YouTube', 'Google', 'WhatsApp', 'Facebook', 'Instagram', 'LinkedIn', 'Friend', 'Relatives', 'Other']
const referenceProfileOptions = ['', 'Professional', 'Farmer', 'Student', 'Other']
const referenceRelationOptions = ['', 'Brother', 'Sister', 'Father', 'Mother', 'Spouse', 'Relative', 'Friend', 'Colleague', 'Neighbor', 'Teacher', 'Other']

const requiredFields = ['candidateName', 'mobileNumber']
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const MAX_DOCUMENT_FILES_PER_TYPE = 10

const createEmptyAddressParts = () => ({
  addressLine: '',
  village: '',
  taluka: '',
  district: '',
  state: ''
})

const formatAddressParts = (parts) =>
  addressPartFields
    .map((field) => [field.label, String(parts[field.name] || '').trim()])
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`)
    .join(', ')

const getSelectedOptionValue = (value, otherValue) => {
  const selected = String(value || '').trim()
  if (selected !== 'Other' && selected !== 'Any Other') return selected
  return String(otherValue || '').trim() || selected
}

const formatEducationDetails = (form) => {
  const sector = getSelectedOptionValue(form.educationSector, form.educationSectorOther)
  const yearOfHigherEducation = String(form.yearOfHigherEducation || '').trim()
  const branch = getSelectedOptionValue(form.educationBranch, form.educationBranchOther)
  const specialization = getSelectedOptionValue(form.educationSpecialization, form.educationSpecializationOther)
  const qualificationDetails = String(form.education || '').trim()

  return [
    sector ? `Highest Education Like Graduate, Post Graduate: ${sector}` : '',
    yearOfHigherEducation ? `Passing Year of Education: ${yearOfHigherEducation}` : '',
    branch ? `Education Branch: ${branch}` : '',
    specialization ? `Education Specialization: ${specialization}` : '',
    qualificationDetails ? `Qualification Details: ${qualificationDetails}` : ''
  ].filter(Boolean).join('\n')
}

const formatComputerCourses = (form) => {
  const computerCourse = getSelectedOptionValue(form.computerCourse, form.computerCourseOther)
  const certificationCourse = getSelectedOptionValue(form.certificationCourse, form.certificationCourseOther)
  const typingSelection = [
    form.computerCourse === 'Typing' && form.englishTyping ? 'English Typing' : '',
    form.computerCourse === 'Typing' && form.hindiTyping ? 'Hindi Typing' : ''
  ].filter(Boolean).join(', ')

  return [
    computerCourse ? `Computer Course: ${computerCourse}` : '',
    typingSelection ? `Typing Selection: ${typingSelection}` : '',
    certificationCourse ? `Other Certification Course: ${certificationCourse}` : ''
  ].filter(Boolean).join('\n')
}

const formatInstituteReferenceDetails = (references, instituteAddress) => {
  const rows = sanitizedCollegeReferenceRows(references)
  const formattedRows = rows.map((reference, index) => {
    const referenceAddress = [
      reference.addressVillage?.trim() ? `Village: ${reference.addressVillage.trim()}` : '',
      reference.addressTaluka?.trim() ? `Taluka: ${reference.addressTaluka.trim()}` : '',
      reference.addressDistrict?.trim() ? `District: ${reference.addressDistrict.trim()}` : '',
      reference.addressState?.trim() ? `State: ${reference.addressState.trim()}` : ''
    ].filter(Boolean).join(', ')
    return [
      rows.length > 1 ? `College Reference ${index + 1}` : '',
      reference.instituteName?.trim() ? `College Name: ${reference.instituteName.trim()}` : '',
      getSelectedOptionValue(reference.educationBranch, reference.educationBranchOther) ? `College Education Branch: ${getSelectedOptionValue(reference.educationBranch, reference.educationBranchOther)}` : '',
      reference.representativeName?.trim() ? `College Representative Name: ${reference.representativeName.trim()}` : '',
      getSelectedOptionValue(reference.designation, reference.designationOther) ? `Designation: ${getSelectedOptionValue(reference.designation, reference.designationOther)}` : '',
      reference.mobileNumber?.trim() ? `College Mobile Number: ${reference.mobileNumber.trim()}` : '',
      referenceAddress ? `College Address: ${referenceAddress}` : ''
    ].filter(Boolean).join('\n')
  })

  return [
    ...formattedRows,
    instituteAddress ? `College Address: ${instituteAddress}` : ''
  ].filter(Boolean).join('\n\n')
}

const formatPostGraduateReferenceDetails = (form) =>
  [
    form.postGraduateInstituteName?.trim() ? `Post Graduate College Name: ${form.postGraduateInstituteName.trim()}` : '',
    getSelectedOptionValue(form.postGraduateEducationBranch, form.postGraduateEducationBranchOther) ? `Post Graduate Education Branch: ${getSelectedOptionValue(form.postGraduateEducationBranch, form.postGraduateEducationBranchOther)}` : '',
    form.postGraduateRepresentativeName?.trim() ? `Post Graduate College Representative Name: ${form.postGraduateRepresentativeName.trim()}` : '',
    getSelectedOptionValue(form.postGraduateDesignation, form.postGraduateDesignationOther) ? `Post Graduate Designation: ${getSelectedOptionValue(form.postGraduateDesignation, form.postGraduateDesignationOther)}` : '',
    form.postGraduateMobileNumber?.trim() ? `Post Graduate Mobile Number: ${form.postGraduateMobileNumber.trim()}` : ''
  ].filter(Boolean).join('\n')

const formatInstituteCollegeDetails = (form) =>
  [
    form.collegeTeacherName?.trim() ? `Institute Representative Name: ${form.collegeTeacherName.trim()}` : '',
    getSelectedOptionValue(form.collegeCourseBranch, form.collegeCourseBranchOther) ? `Course Branch: ${getSelectedOptionValue(form.collegeCourseBranch, form.collegeCourseBranchOther)}` : '',
    form.collegeDesignation?.trim() ? `Designation: ${form.collegeDesignation.trim()}` : '',
    form.collegeMobileNumber?.trim() ? `College Mobile Number: ${form.collegeMobileNumber.trim()}` : '',
    form.collegeReference?.trim() ? `Reference: ${form.collegeReference.trim()}` : ''
  ].filter(Boolean).join('\n')

const formatCareerSummary = (form) => {
  const industrySpecialization = getSelectedOptionValue(form.industrySpecialization, form.industrySpecializationOther)
  const jobWorkingStatus = String(form.jobWorkingStatus || '').trim()
  const experienceType = String(form.experienceType || '').trim()
  const noticePeriod = getSelectedOptionValue(form.noticePeriod, form.noticePeriodOther)
  const careerSummary = String(form.careerSummary || '').trim()

  return [
    industrySpecialization ? `Industry Specialization: ${industrySpecialization}` : '',
    jobWorkingStatus ? `Job Working Status: ${jobWorkingStatus}` : '',
    experienceType ? `Total Experience Type: ${experienceType}` : '',
    noticePeriod ? `Notice Period: ${noticePeriod}` : '',
    formatInterviewAvailability(form) ? `Availability for Interview:\n${formatInterviewAvailability(form)}` : '',
    careerSummary ? `Career Summary: ${careerSummary}` : ''
  ].filter(Boolean).join('\n')
}

const formatInterviewAvailability = (form) =>
  [
    form.availabilityInterviewStartDate?.trim() ? `Available From: ${form.availabilityInterviewStartDate.trim()}` : '',
    form.availabilityInterviewEndDate?.trim() ? `Available To: ${form.availabilityInterviewEndDate.trim()}` : '',
    form.interviewMode?.trim() ? `Interview Mode: ${form.interviewMode.trim()}` : '',
    form.interviewMode === 'Online' && form.onlineInterviewMode?.trim() ? `Online Interview Mode: ${form.onlineInterviewMode.trim()}` : ''
  ].filter(Boolean).join('\n')

const formatKeySkills = (form) => {
  const category = getSelectedOptionValue(form.keySkillCategory, form.keySkillCategoryOther)
  const selectedSkills = Array.isArray(form.keySkillItems) ? form.keySkillItems.filter(Boolean) : []
  const skills = [
    ...selectedSkills.filter((skill) => skill !== 'Other'),
    form.keySkillOther?.trim()
  ].filter(Boolean)

  if (category && skills.length) return `${category}: ${skills.join(', ')}`
  if (category) return category
  if (skills.length) return skills.join(', ')
  return form.keySkillsKnowledge?.trim() || ''
}

const getNoticePeriodDays = (noticePeriod) => {
  const match = String(noticePeriod || '').match(/^(\d+)/)
  return match ? match[1] : ''
}

const dateInputToday = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

const calculateAgeFromDate = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!year || !month || !day) return ''

  const birthDate = new Date(year, month - 1, day)
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) return ''

  const today = new Date()
  if (birthDate > today) return ''

  let age = today.getFullYear() - year
  const birthdayThisYear = new Date(today.getFullYear(), month - 1, day)
  if (today < birthdayThisYear) age -= 1

  return age >= 0 ? String(age) : ''
}

const siblingHasValue = (sibling = {}) =>
  Object.values(sibling).some((value) => String(value ?? '').trim())

const normalizeSiblingRows = (siblings) => {
  const rows = Array.isArray(siblings) && siblings.length ? siblings : [createEmptySibling()]
  return rows.map((sibling) => ({ ...createEmptySibling(), ...(sibling || {}) }))
}

const sanitizedSiblingRows = (siblings) =>
  normalizeSiblingRows(siblings)
    .map((sibling) => ({
      ...sibling,
      siblingStudyStandard: sibling.siblingCareerProfile === 'Studying' ? sibling.siblingStudyStandard : '',
      siblingStudyStandardOther: sibling.siblingCareerProfile === 'Studying' && sibling.siblingStudyStandard === 'Other' ? sibling.siblingStudyStandardOther : '',
      siblingCareerProfileOther: sibling.siblingCareerProfile === 'Other' ? sibling.siblingCareerProfileOther : ''
    }))
    .filter(siblingHasValue)

const firstSiblingFields = (siblings) => {
  const firstSibling = sanitizedSiblingRows(siblings)[0] || createEmptySibling()
  return {
    siblingName: firstSibling.siblingName,
    siblingEducation: firstSibling.siblingEducation,
    siblingMobileNumber: firstSibling.siblingMobileNumber,
    siblingDateOfBirth: firstSibling.siblingDateOfBirth,
    siblingAge: firstSibling.siblingAge,
    siblingGender: firstSibling.siblingGender,
    siblingCareerProfile: firstSibling.siblingCareerProfile,
    siblingStudyStandard: firstSibling.siblingStudyStandard,
    siblingStudyStandardOther: firstSibling.siblingStudyStandardOther,
    siblingCareerProfileOther: firstSibling.siblingCareerProfileOther
  }
}

const collegeReferenceHasValue = (reference = {}) =>
  Object.values(reference).some((value) => String(value ?? '').trim())

const normalizeCollegeReferenceRows = (references) => {
  const rows = Array.isArray(references) && references.length ? references : [createEmptyCollegeReference()]
  return rows.map((reference) => ({ ...createEmptyCollegeReference(), ...(reference || {}) }))
}

const sanitizedCollegeReferenceRows = (references) =>
  normalizeCollegeReferenceRows(references)
    .map((reference) => ({
      ...reference,
      educationBranchOther: reference.educationBranch === 'Other' ? reference.educationBranchOther : '',
      designationOther: reference.designation === 'Other' ? reference.designationOther : ''
    }))
    .filter(collegeReferenceHasValue)

const firstCollegeReferenceFields = (references) => {
  const firstReference = sanitizedCollegeReferenceRows(references)[0] || createEmptyCollegeReference()
  return {
    collegeName: firstReference.instituteName,
    collegeEducationBranch: firstReference.educationBranch,
    collegeEducationBranchOther: firstReference.educationBranchOther,
    professorName: firstReference.representativeName,
    instituteDesignation: firstReference.designation,
    instituteDesignationOther: firstReference.designationOther,
    professorContactNumber: firstReference.mobileNumber,
    addressVillage: firstReference.addressVillage,
    addressTaluka: firstReference.addressTaluka,
    addressDistrict: firstReference.addressDistrict,
    addressState: firstReference.addressState
  }
}

const collegeReferencePayloadRows = (references) =>
  sanitizedCollegeReferenceRows(references).map((reference) => ({
    instituteName: reference.instituteName,
    representativeName: reference.representativeName,
    educationBranch: getSelectedOptionValue(reference.educationBranch, reference.educationBranchOther),
    educationBranchRaw: reference.educationBranch,
    educationBranchOther: reference.educationBranchOther,
    designation: getSelectedOptionValue(reference.designation, reference.designationOther),
    designationRaw: reference.designation,
    designationOther: reference.designationOther,
    mobileNumber: reference.mobileNumber,
    address: {
      village: reference.addressVillage,
      taluka: reference.addressTaluka,
      district: reference.addressDistrict,
      state: reference.addressState
    }
  }))

const formatCurrentSalaryDetails = (form) =>
  [
    form.netInHandSalary?.trim() ? `NET / In-hand Salary: ${form.netInHandSalary.trim()}` : '',
    form.grossSalaryPerMonth?.trim() ? `Gross Per Month: ${form.grossSalaryPerMonth.trim()}` : '',
    form.ctcSalaryPerMonth?.trim() ? `CTC Per Month: ${form.ctcSalaryPerMonth.trim()}` : ''
  ].filter(Boolean).join('\n')

const formatExpectedSalaryDetails = (form) =>
  [
    form.expectedNetInHandSalary?.trim() ? `Expected NET / In-hand Salary: ${form.expectedNetInHandSalary.trim()}` : '',
    form.expectedGrossSalaryPerMonth?.trim() ? `Expected Gross Per Month: ${form.expectedGrossSalaryPerMonth.trim()}` : '',
    form.expectedCtcSalaryPerMonth?.trim() ? `Expected CTC Per Month: ${form.expectedCtcSalaryPerMonth.trim()}` : '',
    form.expectedSalaryNegotiable?.trim() ? `Expected Salary Negotiable: ${form.expectedSalaryNegotiable.trim()}` : ''
  ].filter(Boolean).join('\n')

const formatKeyResponsibilities = (form) => {
  const responsibilityRole = getSelectedOptionValue(form.careerResponsibilityRole, form.careerResponsibilityRoleOther)

  return [
    responsibilityRole ? `Responsibility Type: ${responsibilityRole}` : '',
    form.careerJobResponsibilities?.trim() ? `Key Job Responsibility As Per Your Experience: ${form.careerJobResponsibilities.trim()}` : ''
  ].filter(Boolean).join('\n')
}

const formatReferenceSuccessDetails = (sources, form) => {
  const sourceText = sources.length
    ? sources.map((source) => (source === 'Other' && form.referenceSourceOther?.trim() ? `Other: ${form.referenceSourceOther.trim()}` : source)).join(', ')
    : ''
  const profile = getSelectedOptionValue(form.referenceProfile, form.referenceProfileOther)
  const relation = getSelectedOptionValue(form.referenceRelation, form.referenceRelationOther)

  return [
    sourceText ? `Reference Source: ${sourceText}` : '',
    profile ? `Reference Profile: ${profile}` : '',
    relation ? `Reference Relation: ${relation}` : ''
  ].filter(Boolean).join('\n')
}

const getSubmitErrorMessage = (error) => {
  const serverMessage = error.response?.data?.message
  if (error.response?.status === 409) {
    return serverMessage || 'A candidate with this mobile number, email, or Aadhaar already exists.'
  }
  return serverMessage || 'Could not submit your application'
}

const getSubmissionStorageKey = () => {
  if (typeof window === 'undefined') return 'success-public-apply:submission'
  return `success-public-apply:${window.location.pathname || 'submission'}`
}

const APPLY_DRAFT_DB_NAME = 'success-public-apply-drafts'
const APPLY_DRAFT_DB_VERSION = 1
const APPLY_DRAFT_STORE = 'drafts'

const getApplyDraftStorageKey = () => {
  if (typeof window === 'undefined') return 'success-public-apply:draft'
  return `success-public-apply:draft:${window.location.pathname || 'submission'}`
}

const openApplyDraftDb = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null)
      return
    }

    const request = window.indexedDB.open(APPLY_DRAFT_DB_NAME, APPLY_DRAFT_DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(APPLY_DRAFT_STORE)) {
        db.createObjectStore(APPLY_DRAFT_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

const runDraftTransaction = async (mode, action) => {
  const db = await openApplyDraftDb()
  if (!db) return null

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(APPLY_DRAFT_STORE, mode)
    const store = transaction.objectStore(APPLY_DRAFT_STORE)
    const request = action(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

const draftFileFromFile = (file) => ({
  name: file.name,
  type: file.type,
  size: file.size,
  lastModified: file.lastModified,
  blob: file
})

const fileFromDraftFile = (entry) => {
  if (!entry?.blob || !entry.name) return null
  try {
    return new File([entry.blob], entry.name, {
      type: entry.type || entry.blob.type || '',
      lastModified: entry.lastModified || Date.now()
    })
  } catch (_error) {
    return null
  }
}

const serializeDraftDocuments = (documents) =>
  Object.entries(documents || {}).reduce((result, [documentKey, files]) => {
    const entries = (files || []).map(draftFileFromFile)
    if (entries.length) result[documentKey] = entries
    return result
  }, {})

const restoreDraftDocuments = (documents) =>
  Object.entries(documents || {}).reduce((result, [documentKey, entries]) => {
    const files = (entries || []).map(fileFromDraftFile).filter(Boolean)
    if (files.length) result[documentKey] = files
    return result
  }, {})

const readStoredApplyDraft = () =>
  runDraftTransaction('readonly', (store) => store.get(getApplyDraftStorageKey())).catch(() => null)

const saveStoredApplyDraft = (draft) =>
  runDraftTransaction('readwrite', (store) =>
    store.put({
      ...draft,
      id: getApplyDraftStorageKey(),
      savedAt: new Date().toISOString()
    })
  ).catch(() => null)

const clearStoredApplyDraft = () =>
  runDraftTransaction('readwrite', (store) => store.delete(getApplyDraftStorageKey())).catch(() => null)

const readStoredSubmission = () => {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.sessionStorage.getItem(getSubmissionStorageKey())
    return stored ? JSON.parse(stored) : null
  } catch (_error) {
    return null
  }
}

const saveStoredSubmission = (submission) => {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(getSubmissionStorageKey(), JSON.stringify(submission))
  } catch (_error) {
    // Ignore storage failures; the success screen still works for this render.
  }
}

const clearStoredSubmission = () => {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem(getSubmissionStorageKey())
  } catch (_error) {
    // Ignore storage failures.
  }
}

export default function ApplyPage() {
  const { code } = useParams()
  const submitRequestedRef = useRef(false)
  const [advisorCode, setAdvisorCode] = useState(String(code || '').toLowerCase())
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [currentAddressParts, setCurrentAddressParts] = useState(() => createEmptyAddressParts())
  const [permanentAddressParts, setPermanentAddressParts] = useState(() => createEmptyAddressParts())
  const [instituteAddressParts, setInstituteAddressParts] = useState(() => createEmptyAddressParts())
  const [collegeAddressParts, setCollegeAddressParts] = useState(() => createEmptyAddressParts())
  const [referenceSuccessSources, setReferenceSuccessSources] = useState([])
  const [sameAsCurrentAddress, setSameAsCurrentAddress] = useState(false)
  const [documents, setDocuments] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(() => readStoredSubmission())
  const [draftLoaded, setDraftLoaded] = useState(false)

  const currentStepConfig = formSteps[currentStep]
  const CurrentStepIcon = currentStepConfig.icon
  const isLastStep = currentStep === formSteps.length - 1
  const progress = Math.round(((currentStep + 1) / formSteps.length) * 100)

  const completedRequired = useMemo(
    () => requiredFields.filter((key) => form[key]?.trim()).length,
    [form]
  )

  const selectedDocumentCount = useMemo(
    () => Object.values(documents).reduce((total, files) => total + (files?.length || 0), 0),
    [documents]
  )

  useEffect(() => {
    let active = true

    if (done) {
      setDraftLoaded(true)
      return () => {
        active = false
      }
    }

    readStoredApplyDraft()
      .then((draft) => {
        if (!active) return
        if (draft?.form) setForm({ ...initialForm, ...draft.form })
        if (draft?.currentStep !== undefined) setCurrentStep(Math.min(Math.max(Number(draft.currentStep) || 0, 0), formSteps.length - 1))
        if (draft?.advisorCode !== undefined) setAdvisorCode(String(draft.advisorCode || ''))
        if (draft?.currentAddressParts) setCurrentAddressParts({ ...createEmptyAddressParts(), ...draft.currentAddressParts })
        if (draft?.permanentAddressParts) setPermanentAddressParts({ ...createEmptyAddressParts(), ...draft.permanentAddressParts })
        if (draft?.instituteAddressParts) setInstituteAddressParts({ ...createEmptyAddressParts(), ...draft.instituteAddressParts })
        if (draft?.collegeAddressParts) setCollegeAddressParts({ ...createEmptyAddressParts(), ...draft.collegeAddressParts })
        if (Array.isArray(draft?.referenceSuccessSources)) setReferenceSuccessSources(draft.referenceSuccessSources)
        if (typeof draft?.sameAsCurrentAddress === 'boolean') setSameAsCurrentAddress(draft.sameAsCurrentAddress)
        if (draft?.documents) setDocuments(restoreDraftDocuments(draft.documents))
      })
      .finally(() => {
        if (active) setDraftLoaded(true)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!draftLoaded || done) return undefined

    const timeoutId = window.setTimeout(() => {
      saveStoredApplyDraft({
        currentStep,
        advisorCode,
        form,
        currentAddressParts,
        permanentAddressParts,
        instituteAddressParts,
        collegeAddressParts,
        referenceSuccessSources,
        sameAsCurrentAddress,
        documents: serializeDraftDocuments(documents)
      })
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [
    advisorCode,
    collegeAddressParts,
    currentAddressParts,
    currentStep,
    documents,
    done,
    draftLoaded,
    form,
    instituteAddressParts,
    permanentAddressParts,
    referenceSuccessSources,
    sameAsCurrentAddress
  ])

  const update = (field, value) => {
    if (submitError) setSubmitError('')
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
        ...(field === 'dateOfBirth' ? { currentAge: calculateAgeFromDate(value) } : {}),
        ...(field === 'siblingDateOfBirth' ? { siblingAge: calculateAgeFromDate(value) } : {})
      }

      if (field === 'siblingCareerProfile') {
        if (value !== 'Studying') {
          next.siblingStudyStandard = ''
          next.siblingStudyStandardOther = ''
        }
        if (value !== 'Other') {
          next.siblingCareerProfileOther = ''
        }
      }

      if (field === 'siblingStudyStandard' && value !== 'Other') {
        next.siblingStudyStandardOther = ''
      }

      if (field === 'educationBranch') {
        next.educationSpecialization = ''
        next.educationSpecializationOther = ''
        if (value !== 'Other') next.educationBranchOther = ''
      }

      if (field === 'educationSpecialization' && value !== 'Other') {
        next.educationSpecializationOther = ''
      }

      if (field === 'collegeEducationBranch' && value !== 'Other') {
        next.collegeEducationBranchOther = ''
      }

      if (field === 'instituteDesignation' && value !== 'Other') {
        next.instituteDesignationOther = ''
      }

      if (field === 'postGraduateEducationBranch' && value !== 'Other') {
        next.postGraduateEducationBranchOther = ''
      }

      if (field === 'postGraduateDesignation' && value !== 'Other') {
        next.postGraduateDesignationOther = ''
      }

      if (field === 'collegeCourseBranch' && value !== 'Other') {
        next.collegeCourseBranchOther = ''
      }

      if (field === 'keySkillCategory') {
        next.keySkillItems = []
        next.keySkillOther = ''
        if (value !== 'Other') next.keySkillCategoryOther = ''
      }

      if (field === 'keySkillItems' && (!Array.isArray(value) || !value.includes('Other'))) {
        next.keySkillOther = ''
      }

      if (field === 'careerResponsibilityRole' && value !== 'Other') {
        next.careerResponsibilityRoleOther = ''
      }

      if (field === 'computerCourse' && value !== 'Typing') {
        next.englishTyping = false
        next.hindiTyping = false
      }

      if (field === 'computerCourse' && value !== 'Other') {
        next.computerCourseOther = ''
      }

      if (field === 'certificationCourse' && value !== 'Other') {
        next.certificationCourseOther = ''
      }

      if (field === 'interestedDepartment' && value !== 'Other') {
        next.interestedDepartmentOther = ''
      }

      if (field === 'preferredIndustry' && value !== 'Other') {
        next.preferredIndustryOther = ''
      }

      if (field === 'industrySpecialization' && value !== 'Other') {
        next.industrySpecializationOther = ''
      }

      if (field === 'experienceType' && value === 'Fresher') {
        next.totalExperience = ''
      }

      if (field === 'noticePeriod' && value !== 'Other') {
        next.noticePeriodOther = ''
      }

      if (field === 'interviewMode' && value !== 'Online') {
        next.onlineInterviewMode = ''
      }

      if (field === 'reasonForJobChange' && value !== 'Any Other') {
        next.reasonForJobChangeOther = ''
      }

      if (field === 'currentJobLocation' && value !== 'Other') {
        next.currentJobLocationOther = ''
      }

      if (field === 'currentJobLocationMidcArea' && value !== 'Other') {
        next.currentJobLocationMidcAreaOther = ''
      }

      if (field === 'referenceProfile' && value !== 'Other') {
        next.referenceProfileOther = ''
      }

      if (field === 'referenceRelation' && value !== 'Other') {
        next.referenceRelationOther = ''
      }

      return next
    })
  }

  const updateSiblings = (siblings) => {
    if (submitError) setSubmitError('')
    const nextSiblings = normalizeSiblingRows(siblings)
    setForm((current) => ({
      ...current,
      ...firstSiblingFields(nextSiblings),
      siblings: nextSiblings
    }))
  }

  const updateCollegeReferences = (references) => {
    if (submitError) setSubmitError('')
    const nextReferences = normalizeCollegeReferenceRows(references)
    setForm((current) => ({
      ...current,
      ...firstCollegeReferenceFields(nextReferences),
      collegeReferences: nextReferences
    }))
  }

  const updateCurrentAddressPart = (field, value) => {
    if (submitError) setSubmitError('')
    setCurrentAddressParts((current) => ({ ...current, [field]: value }))
  }

  const updatePermanentAddressPart = (field, value) => {
    if (submitError) setSubmitError('')
    setPermanentAddressParts((current) => ({ ...current, [field]: value }))
  }

  const updateInstituteAddressPart = (field, value) => {
    if (submitError) setSubmitError('')
    setInstituteAddressParts((current) => ({ ...current, [field]: value }))
  }

  const updateCollegeAddressPart = (field, value) => {
    if (submitError) setSubmitError('')
    setCollegeAddressParts((current) => ({ ...current, [field]: value }))
  }

  const toggleReferenceSuccessSource = (source) => {
    if (submitError) setSubmitError('')
    setReferenceSuccessSources((current) => {
      const nextSources = current.includes(source)
        ? current.filter((item) => item !== source)
        : [...current, source]

      if (source === 'Other' && !nextSources.includes('Other')) {
        setForm((formCurrent) => ({ ...formCurrent, referenceSourceOther: '' }))
      }

      return nextSources
    })
  }

  const normalizeFieldValue = (field, value) => {
    let next = value
    if (field.digitsOnly) next = next.replace(/\D/g, '')
    if (field.uppercase) next = next.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (field.maxLength) next = next.slice(0, field.maxLength)
    return next
  }

  const validateDocumentFile = (file, documentType) => {
    const allowedTypes = new Set(documentType.allowedTypes || Array.from(allowedDocumentImageTypes))
    if (!allowedTypes.has(file.type)) {
      toast.error(`${file.name} ${documentType.typeMessage || 'must be a JPG, PNG, or PDF file'}`)
      return false
    }

    if (file.size <= 0 || file.size > MAX_DOCUMENT_IMAGE_SIZE) {
      toast.error(`${file.name} must be 10MB or less`)
      return false
    }

    return true
  }

  const validatePersonalStep = () => {
    if (!form.candidateName.trim() || !form.mobileNumber.trim()) {
      toast.error('Candidate name and mobile number are required')
      return false
    }

    if (form.mobileNumber.trim().length !== 10) {
      toast.error('Mobile number must be 10 digits')
      return false
    }

    if (form.whatsappNo.trim() && form.whatsappNo.trim().length !== 10) {
      toast.error('WhatsApp number must be 10 digits')
      return false
    }

    if (form.emailId.trim() && !emailRegex.test(form.emailId.trim())) {
      toast.error('Enter a valid email ID')
      return false
    }

    if (form.aadhaarNo.trim() && form.aadhaarNo.trim().length !== 12) {
      toast.error('Aadhar card number must be 12 digits')
      return false
    }

    if (form.panNo.trim() && !panRegex.test(form.panNo.trim())) {
      toast.error('Enter a valid PAN number')
      return false
    }

    return true
  }

  const validatePhoneField = (fieldName, label) => {
    if (form[fieldName].trim() && form[fieldName].trim().length !== 10) {
      toast.error(`${label} must be 10 digits`)
      return false
    }
    return true
  }

  const validateSiblingPhones = () => {
    const invalidIndex = normalizeSiblingRows(form.siblings).findIndex(
      (sibling) => sibling.siblingMobileNumber.trim() && sibling.siblingMobileNumber.trim().length !== 10
    )
    if (invalidIndex >= 0) {
      toast.error(`Sibling ${invalidIndex + 1} mobile number must be 10 digits`)
      return false
    }
    return true
  }

  const validateCurrentStep = () => {
    if (currentStep === 0) {
      return (
        validatePersonalStep() &&
        validatePhoneField('fatherMobileNumber', 'Father mobile number') &&
        validatePhoneField('motherMobileNumber', 'Mother mobile number') &&
        validateSiblingPhones()
      )
    }
    if (currentStep === 1) {
      return (
        validatePhoneField('professorContactNumber', 'Institute mobile number') &&
        validatePhoneField('collegeMobileNumber', 'College mobile number') &&
        validatePhoneField('postGraduateMobileNumber', 'Post graduate mobile number')
      )
    }
    if (currentStep === 3) {
      return validatePhoneField('referenceContactNumber', 'Reference mobile number')
    }
    return true
  }

  const validateBeforeSubmit = () => {
    if (!validatePersonalStep()) return false
    if (!validatePhoneField('professorContactNumber', 'Institute mobile number')) return false
    if (!validatePhoneField('collegeMobileNumber', 'College mobile number')) return false
    if (!validatePhoneField('postGraduateMobileNumber', 'Post graduate mobile number')) return false
    if (!validatePhoneField('referenceContactNumber', 'Reference mobile number')) return false
    if (!validatePhoneField('fatherMobileNumber', 'Father mobile number')) return false
    if (!validatePhoneField('motherMobileNumber', 'Mother mobile number')) return false
    if (!validateSiblingPhones()) return false

    return true
  }

  const goToStep = (step) => {
    if (step > currentStep && !validateCurrentStep()) return
    setCurrentStep(step)
  }

  const goNext = () => {
    if (!validateCurrentStep()) return
    setCurrentStep((step) => Math.min(step + 1, formSteps.length - 1))
  }

  const goBack = () => {
    setCurrentStep((step) => Math.max(step - 1, 0))
  }

  const addDocumentFiles = (documentType, fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return

    if (submitError) setSubmitError('')
    setDocuments((current) => {
      const currentFiles = current[documentType.key] || []
      const validFiles = files.filter((item) => validateDocumentFile(item, documentType))
      if (!validFiles.length) return current

      if (currentFiles.length + validFiles.length > MAX_DOCUMENT_FILES_PER_TYPE) {
        toast.error(`Upload up to ${MAX_DOCUMENT_FILES_PER_TYPE} files for ${documentType.label}`)
        return current
      }

      return {
        ...current,
        [documentType.key]: [...currentFiles, ...validFiles]
      }
    })
  }

  const removeDocumentFile = (documentKey, index) => {
    setDocuments((current) => {
      const nextFiles = (current[documentKey] || []).filter((_, itemIndex) => itemIndex !== index)
      const next = { ...current }
      if (nextFiles.length) {
        next[documentKey] = nextFiles
      } else {
        delete next[documentKey]
      }
      return next
    })
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!submitRequestedRef.current) {
      return
    }
    submitRequestedRef.current = false

    if (!validateBeforeSubmit()) {
      return
    }

    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = new FormData()
      const effectiveCurrentAddressParts = sameAsCurrentAddress ? permanentAddressParts : currentAddressParts
      const currentAddress = formatAddressParts(effectiveCurrentAddressParts)
      const permanentAddress = formatAddressParts(permanentAddressParts)
      const instituteAddress = formatAddressParts(instituteAddressParts)
      const postGraduateReferenceDetails = formatPostGraduateReferenceDetails(form)
      const instituteCollegeDetails = formatInstituteCollegeDetails(form)
      const referenceSuccessDetails = formatReferenceSuccessDetails(referenceSuccessSources, form)
      const siblingRows = sanitizedSiblingRows(form.siblings)
      const firstSibling = firstSiblingFields(siblingRows)
      const collegeReferenceRows = sanitizedCollegeReferenceRows(form.collegeReferences)
      const firstCollegeReference = firstCollegeReferenceFields(collegeReferenceRows)
      const collegeReferencePayload = collegeReferencePayloadRows(collegeReferenceRows)
      const instituteReferenceDetails = formatInstituteReferenceDetails(collegeReferenceRows, instituteAddress)
      const familyDetails = {
        fatherOrHusbandName: form.fatherOrHusbandName,
        fatherOccupation: form.fatherOccupation,
        fatherMobileNumber: form.fatherMobileNumber,
        motherOrWifeName: form.motherOrWifeName,
        motherOccupation: form.motherOccupation,
        motherMobileNumber: form.motherMobileNumber,
        ...firstSibling,
        siblings: siblingRows
      }
      const placementReference = {
        professorName: firstCollegeReference.professorName,
        professorContactNumber: firstCollegeReference.professorContactNumber,
        referenceBy: form.referenceBy,
        referenceContactNumber: form.referenceContactNumber
      }
      const applicationDetails = {
        personal: {
          candidateName: form.candidateName,
          mobileNumber: form.mobileNumber,
          whatsappNo: form.whatsappNo,
          emailId: form.emailId,
          gender: form.gender,
          currentAge: form.currentAge,
          marriageStatus: form.marriageStatus,
          aadhaarNo: form.aadhaarNo,
          panNo: form.panNo,
          dateOfBirth: form.dateOfBirth,
          currentAddress: effectiveCurrentAddressParts,
          permanentAddress: permanentAddressParts,
          sameAsCurrentAddress,
          familyDetails
        },
        education: {
          educationSector: form.educationSector,
          educationSectorOther: form.educationSectorOther,
          highestEducation: getSelectedOptionValue(form.educationSector, form.educationSectorOther),
          yearOfHigherEducation: form.yearOfHigherEducation,
          educationBranch: form.educationBranch,
          educationBranchOther: form.educationBranchOther,
          branch: getSelectedOptionValue(form.educationBranch, form.educationBranchOther),
          educationSpecialization: form.educationSpecialization,
          educationSpecializationOther: form.educationSpecializationOther,
          specialization: getSelectedOptionValue(form.educationSpecialization, form.educationSpecializationOther),
          computerCourse: form.computerCourse,
          computerCourseOther: form.computerCourseOther,
          englishTyping: form.computerCourse === 'Typing' ? Boolean(form.englishTyping) : false,
          hindiTyping: form.computerCourse === 'Typing' ? Boolean(form.hindiTyping) : false,
          certificationCourse: form.certificationCourse,
          certificationCourseOther: form.certificationCourseOther,
          instituteReference: {
            instituteName: firstCollegeReference.collegeName,
            representativeName: firstCollegeReference.professorName,
            educationBranch: getSelectedOptionValue(firstCollegeReference.collegeEducationBranch, firstCollegeReference.collegeEducationBranchOther),
            educationBranchRaw: firstCollegeReference.collegeEducationBranch,
            educationBranchOther: firstCollegeReference.collegeEducationBranchOther,
            designation: getSelectedOptionValue(firstCollegeReference.instituteDesignation, firstCollegeReference.instituteDesignationOther),
            designationRaw: firstCollegeReference.instituteDesignation,
            designationOther: firstCollegeReference.instituteDesignationOther,
            mobileNumber: firstCollegeReference.professorContactNumber,
            address: {
              village: firstCollegeReference.addressVillage || instituteAddressParts.village,
              taluka: firstCollegeReference.addressTaluka || instituteAddressParts.taluka,
              district: firstCollegeReference.addressDistrict || instituteAddressParts.district,
              state: firstCollegeReference.addressState || instituteAddressParts.state
            }
          },
          instituteReferences: collegeReferencePayload,
          postGraduateReference: {
            instituteName: form.postGraduateInstituteName,
            representativeName: form.postGraduateRepresentativeName,
            educationBranch: getSelectedOptionValue(form.postGraduateEducationBranch, form.postGraduateEducationBranchOther),
            educationBranchRaw: form.postGraduateEducationBranch,
            educationBranchOther: form.postGraduateEducationBranchOther,
            designation: getSelectedOptionValue(form.postGraduateDesignation, form.postGraduateDesignationOther),
            designationRaw: form.postGraduateDesignation,
            designationOther: form.postGraduateDesignationOther,
            mobileNumber: form.postGraduateMobileNumber
          },
          instituteCollege: {
            college12GraduateName: form.college12GraduateName,
            postGraduateCollegeName: form.postGraduateCollegeName,
            teacherName: form.collegeTeacherName,
            courseBranch: getSelectedOptionValue(form.collegeCourseBranch, form.collegeCourseBranchOther),
            courseBranchRaw: form.collegeCourseBranch,
            courseBranchOther: form.collegeCourseBranchOther,
            designation: form.collegeDesignation,
            mobileNumber: form.collegeMobileNumber,
            reference: form.collegeReference,
            address: collegeAddressParts
          }
        },
        professional: {
          preferredDepartment: getSelectedOptionValue(form.interestedDepartment, form.interestedDepartmentOther),
          preferredDepartmentRaw: form.interestedDepartment,
          preferredDepartmentOther: form.interestedDepartmentOther,
          preferredIndustry: getSelectedOptionValue(form.preferredIndustry, form.preferredIndustryOther),
          preferredIndustryRaw: form.preferredIndustry,
          preferredIndustryOther: form.preferredIndustryOther,
          industrySpecialization: getSelectedOptionValue(form.industrySpecialization, form.industrySpecializationOther),
          industrySpecializationRaw: form.industrySpecialization,
          industrySpecializationOther: form.industrySpecializationOther,
          currentSalary: {
            netInHand: form.netInHandSalary,
            grossPerMonth: form.grossSalaryPerMonth,
            ctcPerMonth: form.ctcSalaryPerMonth
          },
          expectedSalary: {
            netInHand: form.expectedNetInHandSalary,
            grossPerMonth: form.expectedGrossSalaryPerMonth,
            ctcPerMonth: form.expectedCtcSalaryPerMonth,
            negotiable: form.expectedSalaryNegotiable
          },
          expectedSalaryNegotiable: form.expectedSalaryNegotiable,
          currentJobLocation: form.currentJobLocation,
          currentJobLocationOther: form.currentJobLocation === 'Other' ? form.currentJobLocationOther : '',
          currentJobLocationMidcArea: form.currentJobLocationMidcArea,
          currentJobLocationMidcAreaOther: form.currentJobLocationMidcArea === 'Other' ? form.currentJobLocationMidcAreaOther : '',
          preferredJobLocation: form.preferredJobLocation,
          jobWorkingStatus: form.jobWorkingStatus,
          experienceType: form.experienceType,
          totalExperience: form.experienceType === 'Fresher' ? '0' : form.totalExperience,
          noticePeriod: getSelectedOptionValue(form.noticePeriod, form.noticePeriodOther),
          noticePeriodRaw: form.noticePeriod,
          noticePeriodOther: form.noticePeriodOther,
          availabilityForInterview: formatInterviewAvailability(form),
          availabilityInterviewStartDate: form.availabilityInterviewStartDate,
          availabilityInterviewEndDate: form.availabilityInterviewEndDate,
          interviewMode: form.interviewMode,
          onlineInterviewMode: form.interviewMode === 'Online' ? form.onlineInterviewMode : '',
          reasonForJobChange: getSelectedOptionValue(form.reasonForJobChange, form.reasonForJobChangeOther),
          reasonForJobChangeRaw: form.reasonForJobChange,
          reasonForJobChangeOther: form.reasonForJobChangeOther,
          keySkillCategory: form.keySkillCategory,
          keySkillCategoryOther: form.keySkillCategoryOther,
          keySkillItems: Array.isArray(form.keySkillItems) ? form.keySkillItems : [],
          keySkillOther: form.keySkillOther,
          keySkillsKnowledge: formatKeySkills(form),
          careerResponsibilityRole: getSelectedOptionValue(form.careerResponsibilityRole, form.careerResponsibilityRoleOther),
          careerResponsibilityRoleRaw: form.careerResponsibilityRole,
          careerResponsibilityRoleOther: form.careerResponsibilityRoleOther,
          careerJobResponsibilities: form.careerJobResponsibilities
        },
        referenceSuccess: {
          advisorCode: advisorCode.trim().toLowerCase(),
          referenceName: form.referenceBy,
          referenceMobileNumber: form.referenceContactNumber,
          referenceProfile: getSelectedOptionValue(form.referenceProfile, form.referenceProfileOther),
          referenceProfileRaw: form.referenceProfile,
          referenceProfileOther: form.referenceProfileOther,
          referenceRelation: getSelectedOptionValue(form.referenceRelation, form.referenceRelationOther),
          referenceRelationRaw: form.referenceRelation,
          referenceRelationOther: form.referenceRelationOther,
          referenceSources: referenceSuccessSources,
          referenceSourceOther: referenceSuccessSources.includes('Other') ? form.referenceSourceOther : ''
        }
      }
      const preparedForm = {
        ...form,
        ...firstSibling,
        ...firstCollegeReference,
        siblings: JSON.stringify(siblingRows),
        collegeReferences: JSON.stringify(collegeReferenceRows),
        currentJobLocationOther: form.currentJobLocation === 'Other' ? form.currentJobLocationOther : '',
        currentJobLocationMidcAreaOther: form.currentJobLocationMidcArea === 'Other' ? form.currentJobLocationMidcAreaOther : '',
        professorName: firstCollegeReference.professorName,
        professorContactNumber: firstCollegeReference.professorContactNumber,
        currentAddress,
        permanentAddress,
        education: formatEducationDetails(form),
        computerCourses: formatComputerCourses(form),
        appliedFor: getSelectedOptionValue(form.interestedDepartment, form.interestedDepartmentOther),
        interestedDepartment: getSelectedOptionValue(form.interestedDepartment, form.interestedDepartmentOther),
        preferredIndustry: getSelectedOptionValue(form.preferredIndustry, form.preferredIndustryOther),
        careerSummary: formatCareerSummary(form),
        totalExperience: form.experienceType === 'Fresher' ? '0' : form.totalExperience,
        noticePeriod: getNoticePeriodDays(form.noticePeriod),
        availabilityForInterview: formatInterviewAvailability(form),
        interviewMode: form.interviewMode,
        currentSalary: formatCurrentSalaryDetails(form),
        expectedSalary: formatExpectedSalaryDetails(form),
        keyResponsibilities: formatKeyResponsibilities(form),
        keySkillsKnowledge: formatKeySkills(form),
        reasonForJobChange: getSelectedOptionValue(form.reasonForJobChange, form.reasonForJobChangeOther),
        otherAchievements: [instituteReferenceDetails, postGraduateReferenceDetails, instituteCollegeDetails].filter(Boolean).join('\n\n')
      }

      Object.entries(preparedForm).forEach(([key, value]) => {
        payload.append(key, value ?? '')
      })
      payload.append('familyDetails', JSON.stringify(familyDetails))
      payload.append('placementReference', JSON.stringify(placementReference))
      payload.append('applicationDetails', JSON.stringify(applicationDetails))

      if (advisorCode.trim()) {
        payload.append('advisorCode', advisorCode.trim().toLowerCase())
      }

      Object.entries(documents).forEach(([documentKey, files]) => {
        files.forEach((file) => {
          payload.append(`documents.${documentKey}`, file)
        })
      })

      const { data } = await api.post('/public/apply', payload)
      const submission = {
        name: form.candidateName.trim(),
        mode: data.mode || (advisorCode.trim() ? 'advisor' : 'walkin'),
        candidateCode: data.candidateCode || '',
        submittedAt: new Date().toISOString()
      }
      clearStoredApplyDraft()
      saveStoredSubmission(submission)
      setDone(submission)
    } catch (error) {
      const message = getSubmitErrorMessage(error)
      setSubmitError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <PublicShell>
        <section className="mx-auto max-w-lg rounded-lg bg-white px-5 py-8 text-center shadow-sm ring-1 ring-slate-200 sm:px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Application Submitted</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Thank you {done.name}. {done.mode === 'advisor' ? 'Your application was sent to the advisor flow.' : 'Your application was sent directly to candidate management.'}
          </p>
          {done.candidateCode ? <p className="mt-2 text-sm font-semibold text-sky-700">Your Candidate ID: {done.candidateCode}</p> : null}
          <button
            type="button"
            onClick={() => {
              clearStoredSubmission()
              clearStoredApplyDraft()
              setDone(null)
              setCurrentStep(0)
              setForm(initialForm)
              setCurrentAddressParts(createEmptyAddressParts())
              setPermanentAddressParts(createEmptyAddressParts())
              setInstituteAddressParts(createEmptyAddressParts())
              setCollegeAddressParts(createEmptyAddressParts())
              setReferenceSuccessSources([])
              setSameAsCurrentAddress(false)
              setDocuments({})
              setSubmitError('')
            }}
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Submit another application
          </button>
        </section>
      </PublicShell>
    )
  }

  return (
    <PublicShell>
      <form onSubmit={submit} className="mx-auto grid max-w-5xl gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
        <WizardSidebar
          currentStep={currentStep}
          progress={progress}
          completedRequired={completedRequired}
          advisorCode={advisorCode}
          selectedDocumentCount={selectedDocumentCount}
          onStep={goToStep}
        />

        <div className="min-w-0 space-y-3">
          <MobileProgress currentStep={currentStep} progress={progress} />

          {submitError ? (
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-sm font-semibold">{submitError}</p>
            </div>
          ) : null}

          <section className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <header className="border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <CurrentStepIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-sky-700">Step {currentStep + 1} of {formSteps.length}</p>
                  <h2 className="mt-0.5 text-lg font-bold leading-6 text-slate-950">{currentStepConfig.title}</h2>
                </div>
              </div>
            </header>

            <div className="px-4 py-4 sm:px-5">
              {currentStep === 0 ? (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {personalFields.map((field) => (
                      <Field key={field.name} field={field} value={form[field.name]} onChange={(value) => update(field.name, normalizeFieldValue(field, value))} />
                    ))}
                    <SelectField label="Gender" value={form.gender} onChange={(value) => update('gender', value)} options={['', 'Male', 'Female', 'Other']} />
                    <SelectField label="Marital Status" value={form.marriageStatus} onChange={(value) => update('marriageStatus', value)} options={['', 'Married', 'Unmarried', 'Single', 'Widow']} />
                  </div>

                  <AddressSection
                    title="Permanent Address"
                    values={permanentAddressParts}
                    onChange={updatePermanentAddressPart}
                  />

                  <AddressSection
                    title="Current Address"
                    values={sameAsCurrentAddress ? permanentAddressParts : currentAddressParts}
                    onChange={updateCurrentAddressPart}
                    disabled={sameAsCurrentAddress}
                    action={(
                      <label className="inline-flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700">
                        <input
                          type="checkbox"
                          checked={sameAsCurrentAddress}
                          onChange={(event) => {
                            if (submitError) setSubmitError('')
                            setSameAsCurrentAddress(event.target.checked)
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        />
                        Current address same as permanent address
                      </label>
                    )}
                  />

                  <div className="border-t border-slate-200 pt-5">
                    <h3 className="mb-4 text-sm font-bold text-slate-800">Family Details</h3>
                    <FieldGrid fields={familyFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} />
                    <div className="mt-5">
                      <SiblingDetailsEditor
                        siblings={form.siblings}
                        onChange={updateSiblings}
                        normalizeFieldValue={normalizeFieldValue}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <EducationDetails
                  form={form}
                  update={update}
                  updateCollegeReferences={updateCollegeReferences}
                  normalizeFieldValue={normalizeFieldValue}
                  instituteAddressParts={instituteAddressParts}
                  updateInstituteAddressPart={updateInstituteAddressPart}
                  collegeAddressParts={collegeAddressParts}
                  updateCollegeAddressPart={updateCollegeAddressPart}
                />
              ) : null}

              {currentStep === 2 ? <ProfessionalDetails form={form} update={update} normalizeFieldValue={normalizeFieldValue} /> : null}

              {currentStep === 3 ? (
                <ReferenceSuccessDetails
                  form={form}
                  update={update}
                  normalizeFieldValue={normalizeFieldValue}
                  selectedSources={referenceSuccessSources}
                  onToggleSource={toggleReferenceSuccessSource}
                  advisorCode={advisorCode}
                  setAdvisorCode={setAdvisorCode}
                />
              ) : null}

              {currentStep === 4 ? (
                <div className="space-y-6">
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                      <FileImage className="h-4 w-4 text-sky-700" />
                      Upload Documents
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {resumeCandidateDocumentType ? (
                        <DocumentUpload
                          key={resumeCandidateDocumentType.key}
                          documentType={resumeCandidateDocumentType}
                          files={documents[resumeCandidateDocumentType.key] || []}
                          onFiles={(files) => addDocumentFiles(resumeCandidateDocumentType, files)}
                          onRemove={(index) => removeDocumentFile(resumeCandidateDocumentType.key, index)}
                        />
                      ) : null}
                      <EducationCertificateUploadGroup
                        documents={documents}
                        addDocumentFiles={addDocumentFiles}
                        removeDocumentFile={removeDocumentFile}
                      />
                      <ComputerCourseUploadGroup
                        documents={documents}
                        addDocumentFiles={addDocumentFiles}
                        removeDocumentFile={removeDocumentFile}
                      />
                      {otherCandidateDocumentTypes.map((documentType) => (
                        <DocumentUpload
                          key={documentType.key}
                          documentType={documentType}
                          files={documents[documentType.key] || []}
                          onFiles={(files) => addDocumentFiles(documentType, files)}
                          onRemove={(index) => removeDocumentFile(documentType.key, index)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          <div className="sticky bottom-3 z-20 rounded-lg bg-white/95 p-2.5 shadow-lg shadow-slate-900/10 ring-1 ring-slate-200 backdrop-blur sm:static sm:shadow-sm">
            <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentStep === 0 || submitting}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-28"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              {isLastStep ? (
                <button
                  type="submit"
                  onClick={() => {
                    submitRequestedRef.current = true
                  }}
                  disabled={submitting}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-70 sm:min-w-52"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={submitting}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-70 sm:min-w-36"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </PublicShell>
  )
}

const inputClassName = 'mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-[13px] leading-5 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-cyan-100'

function PublicShell({ children }) {
  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 text-slate-950 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:mb-4">
          <div className="bg-gradient-to-r from-[#fffce3] via-[#f3faef] to-[#d9f4fb] px-3 py-3 sm:px-4">
            <div className="grid gap-2 text-center sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <img src="/success-logo.svg" alt="SUCCESS HR Solution" className="h-14 w-36 object-contain sm:h-16 sm:w-36 lg:w-40" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black leading-tight text-sky-900 sm:text-2xl lg:text-3xl">SUCCESS HR SOLUTION'S</h1>
                <p className="mt-0.5 text-sm font-extrabold leading-tight text-slate-950 sm:text-base lg:text-lg">Your Success is Our Mission...!</p>
                <p className="mt-0.5 break-words text-[11px] font-semibold text-slate-600 sm:text-xs">www.successhrsolutions.com</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-3 py-2 text-[11px] leading-5 text-slate-900 sm:px-4 sm:text-xs">
            <div className="grid gap-x-5 gap-y-1 font-semibold sm:grid-cols-3">
              <p><span className="font-black">Email: -</span> info@successhrsolutions.com</p>
              <p><span className="font-black">Mob: -</span> 8600463218</p>
              <p><span className="font-black">GSTIN: -</span> 27BUEPA5163R1Z8</p>
            </div>
            <div className="mt-1 grid gap-x-5 gap-y-1 lg:grid-cols-2">
              <p><span className="font-black">Sinner Office: -</span> Near Sai Xerox, below Yashraj Hotel, Near Waje Petrol Pump, Sinner- 422103 Nashik.</p>
              <p><span className="font-black">Nashik Office: -</span> 311, 3rd Floor Atlanta Shopper's, Wasan Nagar, Pathardi Phata, Below Signus Hospital, Nashik.</p>
            </div>
          </div>
        </header>

        {children}

        <footer className="py-7 text-center text-xs font-semibold text-slate-500">Powered by SUCCESS HR Solution</footer>
      </div>
    </main>
  )
}

function WizardSidebar({ currentStep, progress, completedRequired, advisorCode, selectedDocumentCount, onStep }) {
  return (
    <aside className="hidden h-fit rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-5 lg:block">
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <nav className="space-y-1">
        {formSteps.map((step, index) => {
          const StepIcon = step.icon
          const active = index === currentStep
          const complete = index < currentStep

          return (
            <button
              key={step.title}
              type="button"
              onClick={() => onStep(index)}
              className={`flex min-h-10 w-full min-w-0 items-center gap-2.5 rounded-md px-2.5 text-left text-[13px] transition ${
                active
                  ? 'bg-sky-600 text-white'
                  : complete
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${active ? 'bg-white/15' : 'bg-white ring-1 ring-slate-200'}`}>
                <StepIcon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 leading-5">{step.title}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-[13px] text-slate-600">
        <SummaryRow label="Required" value={`${completedRequired}/${requiredFields.length}`} />
        <SummaryRow label="Reference" value={advisorCode.trim() ? advisorCode.trim() : 'Walk-in'} />
        <SummaryRow label="Resume" value={selectedDocumentCount ? 'Selected' : 'Optional'} />
      </div>
    </aside>
  )
}

function MobileProgress({ currentStep, progress }) {
  const StepIcon = formSteps[currentStep].icon

  return (
    <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:hidden">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-700 ring-1 ring-sky-100">
            <StepIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-sky-700">Step {currentStep + 1} of {formSteps.length}</p>
            <p className="truncate text-sm font-bold text-slate-950">{formSteps[currentStep].title}</p>
          </div>
        </div>
        <span className="shrink-0 text-xs font-bold text-slate-500">{progress}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-sky-600 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

function ProfessionalDetails({ form, update, normalizeFieldValue }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-4 text-sm font-bold text-slate-800">Preferred Department</h3>
        <div className="grid gap-3">
          <SelectField
            label="Preferred Department"
            value={form.interestedDepartment}
            onChange={(value) => update('interestedDepartment', value)}
            options={preferredDepartmentOptions}
          />
          {form.interestedDepartment === 'Other' ? (
            <Field
              field={{ name: 'interestedDepartmentOther', label: 'Other Department' }}
              value={form.interestedDepartmentOther}
              onChange={(value) => update('interestedDepartmentOther', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Preferred Industry</h3>
        <div className="grid gap-3">
          <SelectField
            label="Preferred Industry"
            value={form.preferredIndustry}
            onChange={(value) => update('preferredIndustry', value)}
            options={preferredIndustryOptions}
          />
          {form.preferredIndustry === 'Other' ? (
            <Field
              field={{ name: 'preferredIndustryOther', label: 'Other Industry' }}
              value={form.preferredIndustryOther}
              onChange={(value) => update('preferredIndustryOther', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Industry Specialization</h3>
        <div className="grid gap-3">
          <SelectField
            label="Industry Specialization"
            value={form.industrySpecialization}
            onChange={(value) => update('industrySpecialization', value)}
            options={industrySpecializationOptions}
          />
          {form.industrySpecialization === 'Other' ? (
            <Field
              field={{ name: 'industrySpecializationOther', label: 'Other Industry Specialization' }}
              value={form.industrySpecializationOther}
              onChange={(value) => update('industrySpecializationOther', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Expected Salary Per Month</h3>
        <FieldGrid fields={expectedSalaryFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} singleColumn />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Current Salary Per Month</h3>
        <FieldGrid fields={currentSalaryFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} singleColumn />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Job Working Status</h3>
        <div className="grid gap-3">
          <SelectField
            label="Job Working Status"
            value={form.jobWorkingStatus}
            onChange={(value) => update('jobWorkingStatus', value)}
            options={jobWorkingStatusOptions}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Total Years of Experience</h3>
        <div className="grid gap-3">
          <SelectField
            label="Total Year of Experience"
            value={form.experienceType}
            onChange={(value) => {
              update('experienceType', value)
              if (value === 'Fresher') update('totalExperience', '')
            }}
            options={experienceTypeOptions}
          />
          {form.experienceType === 'Experience' ? (
            <Field
              field={{ name: 'totalExperience', label: 'Enter Total Year of Experience', type: 'number' }}
              value={form.totalExperience}
              onChange={(value) => update('totalExperience', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Notice Period</h3>
        <div className="grid gap-3">
          <SelectField
            label="Notice Period"
            value={form.noticePeriod}
            onChange={(value) => update('noticePeriod', value)}
            options={noticePeriodOptions}
          />
          {form.noticePeriod === 'Other' ? (
            <Field
              field={{ name: 'noticePeriodOther', label: 'Other Notice Period', placeholder: 'Enter in days or month' }}
              value={form.noticePeriodOther}
              onChange={(value) => update('noticePeriodOther', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Availability for Interview</h3>
        <div className="grid gap-3">
          <Field
            field={{ name: 'availabilityInterviewStartDate', label: 'Available From', type: 'date', maxToday: false }}
            value={form.availabilityInterviewStartDate}
            onChange={(value) => update('availabilityInterviewStartDate', value)}
          />
          <Field
            field={{ name: 'availabilityInterviewEndDate', label: 'Available To', type: 'date', maxToday: false }}
            value={form.availabilityInterviewEndDate}
            onChange={(value) => update('availabilityInterviewEndDate', value)}
          />
          <SelectField
            label="Interview Mode"
            value={form.interviewMode}
            onChange={(value) => {
              update('interviewMode', value)
              if (value !== 'Online') update('onlineInterviewMode', '')
            }}
            options={interviewModeOptions}
          />
          {form.interviewMode === 'Online' ? (
            <SelectField
              label="Online Interview Mode"
              value={form.onlineInterviewMode}
              onChange={(value) => update('onlineInterviewMode', value)}
              options={['', 'Audio', 'Video']}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Reason for Job Change</h3>
        <div className="grid gap-3">
          <SelectField
            label="Reason For Job Change"
            value={form.reasonForJobChange}
            onChange={(value) => update('reasonForJobChange', value)}
            options={reasonForJobChangeOptions}
          />
          {form.reasonForJobChange === 'Any Other' ? (
            <Field
              field={{ name: 'reasonForJobChangeOther', label: 'Other Reason' }}
              value={form.reasonForJobChangeOther}
              onChange={(value) => update('reasonForJobChangeOther', value)}
            />
          ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Key Skills You Have</h3>
        <KeySkillsPicker form={form} update={update} />
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Key Job Responsibility As Per Your Experience</h3>
        <div className="mb-3 grid gap-3 md:grid-cols-2">
          <SelectField
            label="Responsibility Type"
            value={form.careerResponsibilityRole}
            onChange={(value) => update('careerResponsibilityRole', value)}
            options={careerResponsibilityRoleOptions}
          />
          {form.careerResponsibilityRole === 'Other' ? (
            <Field
              field={{ name: 'careerResponsibilityRoleOther', label: 'Other Responsibility Type' }}
              value={form.careerResponsibilityRoleOther}
              onChange={(value) => update('careerResponsibilityRoleOther', value)}
            />
          ) : null}
        </div>
        <Field
          field={{ name: 'careerJobResponsibilities', label: 'Key job responsibility as per your experience', kind: 'area' }}
          value={form.careerJobResponsibilities}
          onChange={(value) => update('careerJobResponsibilities', value)}
        />
      </div>

    </div>
  )
}

function KeySkillsPicker({ form, update }) {
  const selectedSkills = Array.isArray(form.keySkillItems) ? form.keySkillItems : []
  const skillOptions = keySkillOptionsByCategory[form.keySkillCategory] || []
  const toggleSkill = (skill) => {
    update('keySkillItems', selectedSkills.includes(skill) ? selectedSkills.filter((item) => item !== skill) : [...selectedSkills, skill])
  }

  return (
    <div className="grid gap-3">
      <SelectField
        label="Skill Category"
        value={form.keySkillCategory}
        onChange={(value) => update('keySkillCategory', value)}
        options={keySkillCategoryOptions}
      />
      {form.keySkillCategory === 'Other' ? (
        <Field
          field={{ name: 'keySkillCategoryOther', label: 'Other Skill Category' }}
          value={form.keySkillCategoryOther}
          onChange={(value) => update('keySkillCategoryOther', value)}
        />
      ) : null}
      {skillOptions.length ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {skillOptions.map((skill) => (
            <label key={skill} className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={selectedSkills.includes(skill)}
                onChange={() => toggleSkill(skill)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {skill}
            </label>
          ))}
        </div>
      ) : null}
      {form.keySkillCategory === 'Other' || selectedSkills.includes('Other') ? (
        <Field
          field={{ name: 'keySkillOther', label: 'Other Skill' }}
          value={form.keySkillOther}
          onChange={(value) => update('keySkillOther', value)}
        />
      ) : null}
    </div>
  )
}

function ReferenceSuccessDetails({ form, update, normalizeFieldValue, selectedSources, onToggleSource, advisorCode, setAdvisorCode }) {
  const referenceMobileField = {
    name: 'referenceContactNumber',
    label: 'Reference Mobile Number',
    inputMode: 'numeric',
    maxLength: 10,
    digitsOnly: true
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-bold text-slate-800">Reference Details</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Field
            field={{ name: 'referenceBy', label: 'Reference Name' }}
            value={form.referenceBy}
            onChange={(value) => update('referenceBy', value)}
          />
          <Field
            field={referenceMobileField}
            value={form.referenceContactNumber}
            onChange={(value) => update('referenceContactNumber', normalizeFieldValue(referenceMobileField, value))}
          />
          <SelectField
            label="Reference Profile"
            value={form.referenceProfile}
            onChange={(value) => update('referenceProfile', value)}
            options={referenceProfileOptions}
          />
          {form.referenceProfile === 'Other' ? (
            <Field
              field={{ name: 'referenceProfileOther', label: 'Other Reference Profile' }}
              value={form.referenceProfileOther}
              onChange={(value) => update('referenceProfileOther', value)}
            />
          ) : null}
          <SelectField
            label="Reference Relation"
            value={form.referenceRelation}
            onChange={(value) => {
              update('referenceRelation', value)
              if (value !== 'Other') update('referenceRelationOther', '')
            }}
            options={referenceRelationOptions}
          />
          {form.referenceRelation === 'Other' ? (
            <Field
              field={{ name: 'referenceRelationOther', label: 'Other Reference Relation' }}
              value={form.referenceRelationOther}
              onChange={(value) => update('referenceRelationOther', value)}
            />
          ) : null}
          <label className="block text-xs font-semibold leading-5 text-slate-700">
            Business Advisor Code
            <input
              value={advisorCode}
              onChange={(event) => setAdvisorCode(String(event.target.value || '').trim().toLowerCase())}
              className={inputClassName}
            />
          </label>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Reference Source</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {referenceSourceOptions.map((source) => (
            <label
              key={source}
              className="flex min-h-10 items-center gap-2.5 rounded-md border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700"
            >
              <input
                type="checkbox"
                checked={selectedSources.includes(source)}
                onChange={() => onToggleSource(source)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              {source}
            </label>
          ))}
        </div>
        {selectedSources.includes('Other') ? (
          <div className="mt-4">
            <Field
              field={{ name: 'referenceSourceOther', label: 'Other Reference Source' }}
              value={form.referenceSourceOther}
              onChange={(value) => update('referenceSourceOther', value)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AddressSection({ title, values, onChange, disabled = false, action = null }) {
  const labelPrefix = title === 'Permanent Address' ? 'Permanent' : title === 'Current Address' ? 'Current' : ''
  const labelFor = (field) => {
    if (!labelPrefix) return field.label
    if (field.name === 'addressLine') return `${labelPrefix} Flat No / House No, Society, Landmark`
    return `${labelPrefix} ${field.label}`
  }

  return (
    <div className="border-t border-slate-200 pt-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {action}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {addressPartFields.map((field) => (
          <label key={field.name} className={`block min-w-0 text-xs font-semibold leading-5 text-slate-700 ${field.full ? 'md:col-span-2' : ''}`}>
            <span className="break-words">{labelFor(field)}</span>
            <input
              type="text"
              value={values[field.name] || ''}
              disabled={disabled}
              onChange={(event) => onChange(field.name, event.target.value)}
              className={`${inputClassName} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500`}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function EducationDetails({
  form,
  update,
  updateCollegeReferences,
  normalizeFieldValue,
  instituteAddressParts,
  updateInstituteAddressPart,
  collegeAddressParts,
  updateCollegeAddressPart
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-4 text-sm font-bold text-slate-800">Highest Education Like Graduate, Post Graduate</h3>
        <div className="grid gap-3">
            <SelectField
              label="Highest Education Like Graduate, Post Graduate"
              value={form.educationSector}
              onChange={(value) => update('educationSector', value)}
              options={educationSectorOptions}
            />
            <SelectField
              label="Passing Year of Education"
              value={form.yearOfHigherEducation}
              onChange={(value) => update('yearOfHigherEducation', value)}
              options={higherEducationYearOptions}
            />
            {form.educationSector === 'Other' ? (
              <Field
                field={{ name: 'educationSectorOther', label: 'Other Highest Education' }}
                value={form.educationSectorOther}
                onChange={(value) => update('educationSectorOther', value)}
              />
            ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Education Branch</h3>
        <div className="space-y-3">
            <SelectField
              label="Education Branch"
              value={form.educationBranch}
              onChange={(value) => update('educationBranch', value)}
              options={educationBranchOptions}
            />
            {form.educationBranch === 'Other' ? (
              <Field
                field={{ name: 'educationBranchOther', label: 'Mention Your Other Branch' }}
                value={form.educationBranchOther}
                onChange={(value) => update('educationBranchOther', value)}
              />
            ) : null}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Education Specialization</h3>
        <div className="space-y-3">
            <SelectField
              label="Special Subject / Remark"
              value={form.educationSpecialization}
              onChange={(value) => update('educationSpecialization', value)}
              options={educationSpecializationOptionsForBranch(form.educationBranch)}
            />
            {form.educationSpecialization === 'Other' ? (
              <Field
                field={{ name: 'educationSpecializationOther', label: 'Other Special Subject / Remark' }}
                value={form.educationSpecializationOther}
                onChange={(value) => update('educationSpecializationOther', value)}
              />
            ) : null}
        </div>
      </div>

      <InstituteReferenceDetails
        form={form}
        onChange={updateCollegeReferences}
        normalizeFieldValue={normalizeFieldValue}
      />

      <PostGraduateReferenceDetails
        form={form}
        update={update}
        normalizeFieldValue={normalizeFieldValue}
        addressParts={instituteAddressParts}
        onAddressChange={updateInstituteAddressPart}
      />

      <InstituteCollegeDetails
        form={form}
        update={update}
        normalizeFieldValue={normalizeFieldValue}
      />

      <div className="border-t border-slate-200 pt-5">
        <h3 className="mb-4 text-sm font-bold text-slate-800">Other Computer Class Or Certification Details</h3>
        <div className="grid gap-3">
          <SelectField
            label="Computer Courses"
            value={form.computerCourse}
            onChange={(value) => update('computerCourse', value)}
            options={computerCourseOptions}
          />
          {form.computerCourse === 'Typing' ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.englishTyping)}
                  onChange={(event) => update('englishTyping', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                English Typing
              </label>
              <label className="flex min-h-11 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(form.hindiTyping)}
                  onChange={(event) => update('hindiTyping', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Hindi Typing
              </label>
            </div>
          ) : null}
          <SelectField
            label="Other Certification Courses"
            value={form.certificationCourse}
            onChange={(value) => update('certificationCourse', value)}
            options={certificationCourseOptions}
          />
          {form.computerCourse === 'Other' ? (
            <Field
              field={{ name: 'computerCourseOther', label: 'Other Computer Course' }}
              value={form.computerCourseOther}
              onChange={(value) => update('computerCourseOther', value)}
            />
          ) : null}
          {form.certificationCourse === 'Other' ? (
            <Field
              field={{ name: 'certificationCourseOther', label: 'Other Certification Course' }}
              value={form.certificationCourseOther}
              onChange={(value) => update('certificationCourseOther', value)}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function InstituteReferenceDetails({ form, onChange, normalizeFieldValue }) {
  return (
    <div className="border-t border-slate-200 pt-5">
      <h3 className="mb-4 text-sm font-bold text-slate-800">College Reference Details (Like 12th, ITI, Diploma, Graduate)</h3>
      <CollegeReferencesEditor references={form.collegeReferences} onChange={onChange} normalizeFieldValue={normalizeFieldValue} />
    </div>
  )
}

function CollegeReferencesEditor({ references, onChange, normalizeFieldValue }) {
  const rows = normalizeCollegeReferenceRows(references)

  const updateReference = (index, field, value) => {
    const nextRows = rows.map((row, rowIndex) => (rowIndex === index ? { ...row } : row))
    const nextReference = {
      ...nextRows[index],
      [field.name]: normalizeFieldValue(field, value)
    }

    if (field.name === 'educationBranch' && value !== 'Other') {
      nextReference.educationBranchOther = ''
    }

    if (field.name === 'designation' && value !== 'Other') {
      nextReference.designationOther = ''
    }

    nextRows[index] = nextReference
    onChange(nextRows)
  }

  const addReference = () => onChange([...rows, createEmptyCollegeReference()])

  const removeReference = (index) => {
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index)
    onChange(nextRows.length ? nextRows : [createEmptyCollegeReference()])
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={addReference}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add College Reference
        </button>
      </div>

      {rows.map((reference, referenceIndex) => (
        <div key={referenceIndex} className="rounded-md border border-slate-200 bg-slate-50/60 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h5 className="text-sm font-bold text-slate-700">College Reference {referenceIndex + 1}</h5>
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => removeReference(referenceIndex)}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {collegeReferenceFields.map((field) => {
              if (field.showWhen && reference[field.showWhen.name] !== field.showWhen.value) return null
              const resolvedField = {
                ...field,
                options: field.optionsFor ? field.optionsFor(reference) : field.options
              }
              return (
                <Field
                  key={field.name}
                  field={resolvedField}
                  value={reference[field.name] || ''}
                  onChange={(value) => updateReference(referenceIndex, field, value)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function PostGraduateReferenceDetails({ form, update, normalizeFieldValue, addressParts, onAddressChange }) {
  return (
    <div className="border-t border-slate-200 pt-5">
      <h3 className="mb-4 text-sm font-bold text-slate-800">Post Graduate Reference Details</h3>
      <FieldGrid fields={postGraduateReferenceFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} singleColumn />
      <CollegeAddressDetails addressParts={addressParts} onAddressChange={onAddressChange} />
    </div>
  )
}

function CollegeAddressDetails({ addressParts, onAddressChange }) {
  return (
    <div className="mt-3 grid gap-3">
      {collegeAddressPartFields.map((field) => (
        <label key={field.name} className="block min-w-0 text-xs font-semibold leading-5 text-slate-700">
          <span className="break-words">College {field.label}</span>
          <input
            type="text"
            value={addressParts[field.name] || ''}
            onChange={(event) => onAddressChange(field.name, event.target.value)}
            className={inputClassName}
          />
        </label>
      ))}
    </div>
  )
}

function InstituteCollegeDetails({ form, update, normalizeFieldValue }) {
  return (
    <div className="border-t border-slate-200 pt-5">
      <h3 className="mb-4 text-sm font-bold text-slate-800">Institute Details (Private Coaching Classes)</h3>
      <FieldGrid fields={instituteCollegeFields} form={form} update={update} normalizeFieldValue={normalizeFieldValue} singleColumn />
    </div>
  )
}

function FieldGrid({ fields, form, update, normalizeFieldValue, singleColumn = false }) {
  const visibleFields = fields.filter((field) => !field.showWhen || form[field.showWhen.name] === field.showWhen.value)

  return (
    <div className={`grid gap-3 ${singleColumn ? '' : 'md:grid-cols-2 xl:grid-cols-3'}`}>
      {visibleFields.map((field) => {
        const resolvedField = {
          ...field,
          options: field.optionsFor ? field.optionsFor(form) : field.options
        }
        return (
          <Field
            key={field.name}
            field={resolvedField}
            value={form[field.name]}
            onChange={(value) => update(field.name, normalizeFieldValue(field, value))}
          />
        )
      })}
    </div>
  )
}

function SiblingDetailsEditor({ siblings, onChange, normalizeFieldValue }) {
  const rows = normalizeSiblingRows(siblings)

  const updateSibling = (index, field, value) => {
    const nextRows = rows.map((row, rowIndex) => (rowIndex === index ? { ...row } : row))
    const nextSibling = {
      ...nextRows[index],
      [field.name]: normalizeFieldValue(field, value)
    }

    if (field.name === 'siblingDateOfBirth') {
      nextSibling.siblingAge = calculateAgeFromDate(value)
    }

    if (field.name === 'siblingCareerProfile') {
      if (value !== 'Studying') {
        nextSibling.siblingStudyStandard = ''
        nextSibling.siblingStudyStandardOther = ''
      }
      if (value !== 'Other') {
        nextSibling.siblingCareerProfileOther = ''
      }
    }

    if (field.name === 'siblingStudyStandard' && value !== 'Other') {
      nextSibling.siblingStudyStandardOther = ''
    }

    nextRows[index] = nextSibling
    onChange(nextRows)
  }

  const addSibling = () => onChange([...rows, createEmptySibling()])
  const removeSibling = (index) => {
    const nextRows = rows.filter((_, rowIndex) => rowIndex !== index)
    onChange(nextRows.length ? nextRows : [createEmptySibling()])
  }

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Sibling Details</h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">Add each sibling separately.</p>
        </div>
        <button
          type="button"
          onClick={addSibling}
          className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-3 text-xs font-bold text-white hover:bg-sky-700 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Sibling
        </button>
      </div>

      {rows.map((sibling, siblingIndex) => (
        <div key={siblingIndex} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h5 className="text-sm font-bold text-slate-700">Sibling {siblingIndex + 1}</h5>
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => removeSibling(siblingIndex)}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-rose-200 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {siblingFields
              .filter((field) => !field.showWhen || sibling[field.showWhen.name] === field.showWhen.value)
              .map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  value={sibling[field.name]}
                  onChange={(value) => updateSibling(siblingIndex, field, value)}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Field({ field, value, onChange }) {
  return (
    <label className={`block min-w-0 text-xs font-semibold leading-5 text-slate-700 ${field.kind === 'area' ? 'md:col-span-2' : ''}`}>
      <span className="break-words">
        {field.label} {field.required ? <span className="text-rose-500">*</span> : null}
      </span>
      {field.kind === 'area' ? (
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClassName} resize-y`} />
      ) : field.options ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}>
          {field.options.map((option) => (
            <option key={option || 'empty'} value={option}>
              {option || 'Select'}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type || 'text'}
          value={value}
          required={field.required}
          min={field.type === 'number' ? '0' : undefined}
          max={field.type === 'date' && field.maxToday !== false ? dateInputToday() : undefined}
          inputMode={field.inputMode}
          placeholder={field.placeholder}
          readOnly={field.readOnly}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClassName} ${field.readOnly ? 'bg-slate-50 text-slate-600' : ''}`}
        />
      )}
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block min-w-0 text-xs font-semibold leading-5 text-slate-700">
      <span className="break-words">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      >
        {options.map((option) => (
          <option key={option || 'empty'} value={option}>
            {option || 'Select'}
          </option>
        ))}
      </select>
    </label>
  )
}

function EducationCertificateUploadGroup({ documents, addDocumentFiles, removeDocumentFile }) {
  return (
    <div className="rounded-lg border border-sky-200 bg-sky-50/40 p-3 md:col-span-2 xl:col-span-3">
      <div className="mb-3">
        <p className="text-sm font-bold text-slate-900">Education Certificates</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">Upload level-wise certificates like 10th, 12th, Graduate, and Post Graduate.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {educationCertificateDocumentTypes.map((documentType) => (
          <DocumentUpload
            key={documentType.key}
            documentType={documentType}
            label={educationCertificateLabel(documentType)}
            files={documents[documentType.key] || []}
            onFiles={(files) => addDocumentFiles(documentType, files)}
            onRemove={(index) => removeDocumentFile(documentType.key, index)}
          />
        ))}
      </div>
    </div>
  )
}

function ComputerCourseUploadGroup({ documents, addDocumentFiles, removeDocumentFile }) {
  return (
    <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-3 md:col-span-2 xl:col-span-3">
      <div className="mb-3">
        <p className="text-sm font-bold text-slate-900">Computer Courses Certificates</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">Upload course-wise certificates like MS-CIT, CCC, Advanced Excel, Tally, AutoCAD, Typing, and CATIA.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {computerCourseDocumentTypes.map((documentType) => (
          <DocumentUpload
            key={documentType.key}
            documentType={documentType}
            files={documents[documentType.key] || []}
            onFiles={(files) => addDocumentFiles(documentType, files)}
            onRemove={(index) => removeDocumentFile(documentType.key, index)}
          />
        ))}
      </div>
    </div>
  )
}

function DocumentUpload({ documentType, label, files, onFiles, onRemove }) {
  const inputId = `document-${documentType.key}`
  const inputRef = useRef(null)

  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <label htmlFor={inputId} className="block text-[13px] font-bold text-slate-900">
            {label || documentType.label}
          </label>
          <p className="mt-1 text-xs font-semibold text-slate-500">JPG, PNG, or PDF up to 10MB</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 text-xs font-bold text-sky-700 hover:bg-sky-100"
        >
          <UploadCloud className="h-4 w-4" />
          Upload
        </button>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={documentType.accept || 'image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf'}
        className="sr-only"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          event.stopPropagation()
          onFiles(event.target.files)
          event.target.value = ''
        }}
      />

      {files.length ? (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-2 rounded-md bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200">
              <span className="min-w-0 truncate text-xs font-semibold text-slate-700">{file.name}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                aria-label={`Remove ${documentType.label}`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
      <span>{label}</span>
      <span className="max-w-32 truncate text-right font-semibold text-slate-950">{value || '-'}</span>
    </div>
  )
}
