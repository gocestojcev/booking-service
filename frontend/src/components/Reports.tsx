import React, { useState } from 'react';
import CheckInReport from './CheckInReport';
import CheckOutReport from './CheckOutReport';
import './Reports.css';

type ReportType = 'checkin' | 'checkout';

const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<ReportType>('checkin');

  const renderActiveReport = () => {
    switch (activeReport) {
      case 'checkin':
        return <CheckInReport />;
      case 'checkout':
        return <CheckOutReport />;
      default:
        return <CheckInReport />;
    }
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>Reports</h2>
        <div className="report-tabs">
          <button
            className={`report-tab ${activeReport === 'checkin' ? 'active' : ''}`}
            onClick={() => setActiveReport('checkin')}
          >
            Check-in Report
          </button>
          <button
            className={`report-tab ${activeReport === 'checkout' ? 'active' : ''}`}
            onClick={() => setActiveReport('checkout')}
          >
            Check-out Report
          </button>
        </div>
      </div>
      <div className="report-content">
        {renderActiveReport()}
      </div>
    </div>
  );
};

export default Reports;
