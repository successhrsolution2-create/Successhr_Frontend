import React, { forwardRef } from 'react'

const ReceiptTemplate = forwardRef(({ data }, ref) => {
  const {
    sjpsNumber = '',
    date = '',
    receivedFrom = '',
    towards = 'Placement Registration Charges',
    paymentMethod = 'Cash',
    amount = '',
    gstin = ''
  } = data || {}

  // Format date correctly if present
  let displayDate = date
  if (date && date.includes('-')) {
    const [y, m, d] = date.split('T')[0].split('-')
    if (y && m && d) displayDate = `${d}/${m}/${y}`
  } else if (date) {
    const dObj = new Date(date)
    if (!isNaN(dObj)) {
      displayDate = dObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }
  }

  return (
    <div
      ref={ref}
      style={{
        width: '900px',
        height: '650px',
        backgroundColor: '#eaf4fd', // Light blue background for the main body
        fontFamily: 'Arial, sans-serif',
        boxSizing: 'border-box',
        position: 'relative',
        border: '4px solid #000000',
        overflow: 'hidden',
        color: '#000000',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Background Watermark */}
      <div style={{
        position: 'absolute',
        top: '160px',
        left: '0',
        right: '0',
        bottom: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
        opacity: 0.15,
        pointerEvents: 'none'
      }}>
        <img src="/success-logo.jpg" alt="watermark" crossOrigin="anonymous" style={{ width: '80%', height: 'auto', objectFit: 'contain' }} />
      </div>

      {/* Foreground Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Top Section: Logo + (Yellow Header & Address) */}
        <div style={{ display: 'flex', borderBottom: '4px solid #000000' }}>
          
          {/* Left: Logo Box */}
          <div style={{
            width: '160px',
            borderRight: '4px solid #000000',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px'
          }}>
            <div style={{ border: '2px solid #0066cc', padding: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <img src="/success-logo.jpg" alt="Logo" crossOrigin="anonymous" style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }} />
              <div style={{ backgroundColor: '#0066cc', color: '#ffffff', fontSize: '11px', fontWeight: 'bold', width: '100%', textAlign: 'center', padding: '2px 0', marginTop: '2px' }}>
                J.P. & M.S.H.
              </div>
            </div>
          </div>

          {/* Right: Headers */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Yellow Header */}
            <div style={{
              backgroundColor: '#ffcc00', // Yellow
              borderBottom: '4px solid #000000',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 10px'
            }}>
              <div style={{ fontSize: '24px', fontFamily: '"Times New Roman", Times, serif', fontWeight: 'bold' }}>
                SUCCESS JOB PLACEMENT& MULTI SERVICES HUB
              </div>
              <div style={{ fontSize: '18px', fontFamily: '"Times New Roman", Times, serif', fontWeight: 'bold', color: '#ff0000', textDecoration: 'underline', marginTop: '4px' }}>
                “Your Success Our Goal”
              </div>
            </div>

            {/* Address Section */}
            <div style={{
              backgroundColor: '#fae9dd', // Light peach
              padding: '10px 12px',
              textAlign: 'center',
              lineHeight: '1.6',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>
                Sinner Office:- Near Sai Xerox, below Yashraj Hotel, Near Waje Petrol Pump, Sinner- 422103 Nashik
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>
                Nashik Office: - 307, Atlanta Shoppers, W40asan Nagar, Pathardi Phata, below Signus hospital,
              </div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', marginTop: '2px' }}>
                Nashik Email: - <span style={{ color: '#0055ff', textDecoration: 'underline' }}>Successcareerplacement@gmail.com</span>
                <span style={{ margin: '0 16px' }}>Mob:-8600463218</span>
                <span>GSTIN :- {gstin || '-'}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Main Body */}
        <div style={{ flex: 1, padding: '0 30px', position: 'relative' }}>
          
          {/* Centered Overlapping RECEIPT Badge */}
          <div style={{
            position: 'absolute',
            top: '-14px', // Overlap the thick black border
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#000000',
            color: '#ffffff',
            padding: '4px 32px',
            fontWeight: 'bold',
            fontSize: '15px',
            letterSpacing: '1px'
          }}>
            RECEIPT
          </div>

          {/* SJPS & Date Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <div style={{ border: '2px solid #000000', padding: '4px 12px', backgroundColor: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>
              SJPS {sjpsNumber.replace('SJPS ', '')}
            </div>
            <div style={{ border: '2px solid #000000', padding: '4px 12px', backgroundColor: '#ffffff', fontWeight: 'bold', fontSize: '16px' }}>
              Date: {displayDate}
            </div>
          </div>

          {/* Form Fields */}
          <div style={{ marginTop: '24px' }}>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '16px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: '"Times New Roman", Times, serif', marginRight: '8px' }}>
                Received With thanks:
              </span>
              <span style={{ flex: 1, borderBottom: '2px solid #000000', fontSize: '18px', fontWeight: 'bold', paddingBottom: '2px', fontFamily: '"Times New Roman", Times, serif' }}>
                {receivedFrom || '\u00A0'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', marginRight: '8px' }}>
                Towards:
              </span>
              <span style={{ flex: 1, borderBottom: '2px solid #000000', fontSize: '16px', fontWeight: 'bold', paddingBottom: '2px', fontFamily: '"Times New Roman", Times, serif' }}>
                {towards || '\u00A0'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: '16px' }}>
              <span style={{ fontSize: '15px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', marginRight: '8px' }}>
                By <span style={{ textDecoration: 'line-through', textDecorationThickness: '2px' }}>Cheque / Cash/</span> Online:
              </span>
              <span style={{ flex: 1, borderBottom: '2px solid #000000', fontSize: '18px', fontWeight: 'bold', paddingBottom: '2px', fontFamily: '"Times New Roman", Times, serif' }}>
                {paymentMethod || '\u00A0'}
              </span>
            </div>
            
            {/* Amount Box */}
            <div style={{ marginTop: '16px', display: 'flex' }}>
              <div style={{ border: '2px solid #000000', display: 'flex', height: '40px', width: '200px' }}>
                <div style={{ backgroundColor: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', fontSize: '15px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                  Rs:
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', backgroundColor: '#ffffff', fontSize: '16px', fontFamily: 'Arial, sans-serif', fontWeight: 'bold' }}>
                  {amount ? `${amount}/-` : ''}
                </div>
              </div>
            </div>

          </div>

          {/* Notes and Signatures Bottom Section */}
          <div style={{ display: 'flex', marginTop: '24px' }}>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>Note:</div>
              <ul style={{ listStyleType: 'none', margin: 0, padding: 0, paddingLeft: '16px' }}>
                {[
                  'Registration Validity till Life Time.',
                  'Registration Fees no Refundable.',
                  'Candidates Selection on their own efforts /Knowledge',
                  'This Fee is only for notification of job description',
                  'If you will not get suitable interview calls then all fees will be refundable.'
                ].map((note, i) => (
                  <li key={i} style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', marginBottom: '4px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '-16px' }}>➢</span>
                    {note}
                  </li>
                ))}
              </ul>
              
              {/* Candidate Sign Box */}
              <div style={{ marginTop: '16px', width: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', height: '30px', border: '2px solid #000000', backgroundColor: '#ffffff' }}></div>
                <div style={{ fontSize: '11px', fontFamily: 'Arial, sans-serif', marginTop: '4px', fontWeight: 'bold' }}>Candidate Sign</div>
              </div>
            </div>
            
            <div style={{ width: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '10px' }}>
              <div style={{ textAlign: 'center', color: '#8855bb', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: '16px', lineHeight: '1.2' }}>
                SUCCESS JOB PLACEMENT<br/>AND MULTI SERVICES HUB
              </div>
              
              <div style={{ width: '100%', height: '40px', position: 'relative', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Signature line fake */}
                <div style={{ position: 'absolute', width: '60%', borderBottom: '1px solid #000080', top: '25px', opacity: 0.5 }}></div>
                {/* Fake signature text */}
                <div style={{ fontFamily: '"Brush Script MT", cursive, serif', color: '#0000aa', fontSize: '24px', opacity: 0.7, zIndex: 1, transform: 'rotate(-5deg)' }}>
                  B. P. Mutha
                </div>
              </div>

              <div style={{ textAlign: 'center', color: '#8855bb', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' }}>
                PROPRIETOR
              </div>
              
              <div style={{ textAlign: 'center', color: '#000000', fontFamily: 'Arial, sans-serif', fontWeight: 'bold', fontSize: '11px', marginTop: '4px', lineHeight: '1.2' }}>
                FOR, SUCCESS JOB PLACEMENT<br/>& MULTI SERVICES HUB
              </div>
            </div>

          </div>

          <div style={{ position: 'absolute', bottom: '16px', left: '0', width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>Thank You</span>
          </div>

        </div>
      </div>
    </div>
  )
})

ReceiptTemplate.displayName = 'ReceiptTemplate'
export default ReceiptTemplate
