const puppeteer = require('puppeteer');

const generatePDF = async (reportData) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Generate HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20mm; color: #1f2937; }
          .container { max-width: 700px; margin: 0 auto; }
          .header { text-align: center; padding: 20px; background: #f3f4f6; border-radius: 12px; }
          .header h1 { font-size: 24px; margin: 0; }
          .header p { font-size: 16px; color: #4b5563; }
          .section { margin-top: 20px; }
          .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
          .card-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
          .score { font-size: 36px; font-weight: bold; }
          .score-green { color: #10b981; }
          .score-yellow { color: #f59e0b; }
          .score-red { color: #ef4444; }
          .progress { height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; }
          .progress-bar { height: 100%; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
          .badge-green { background: #d1fae5; color: #065f46; }
          .badge-yellow { background: #fef3c7; color: #92400e; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .table th, .table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          .table th { background: #f3f4f6; }
          svg { display: block; margin: 16px auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Security Assessment Report</h1>
            <p>Generated for: ${reportData.userName}</p>
            <p>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Overall Security Score</div>
              <div class="${reportData.overallScore >= 80 ? 'score score-green' : reportData.overallScore >= 60 ? 'score score-yellow' : 'score score-red'}">
                ${reportData.overallScore.toFixed(1)}%
              </div>
              <div class="progress">
                <div class="progress-bar" style="width: ${reportData.overallScore}%; background: ${reportData.overallScore >= 80 ? '#10b981' : reportData.overallScore >= 60 ? '#f59e0b' : '#ef4444'};"></div>
              </div>
              <p>Last Assessment: ${reportData.lastAssessment}</p>
              <p>Total Assessments: ${reportData.totalAssessments}</p>
              ${reportData.attempts.length > 1 ? `<p>Change: ${(reportData.overallScore - reportData.previousScore).toFixed(1)}%</p>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Category Performance</div>
              ${Object.entries(reportData.categoryScores).map(([category, score]) => `
                <div style="margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>${category}</span>
                    <span class="badge ${score >= 80 ? 'badge-green' : score >= 60 ? 'badge-yellow' : 'badge-red'}">${score.toFixed(1)}%</span>
                  </div>
                  <div class="progress">
                    <div class="progress-bar" style="width: ${score}%; background: ${score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'};"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Industry Benchmarks</div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
                <div>
                  <div style="font-size: 20px; font-weight: bold; color: #f59e0b;">${reportData.benchmarks.industry.toFixed(1)}%</div>
                  <div>Industry Average</div>
                </div>
                <div>
                  <div style="font-size: 20px; font-weight: bold; color: #3b82f6;">${reportData.benchmarks.peers.toFixed(1)}%</div>
                  <div>Similar Users</div>
                </div>
                <div>
                  <div style="font-size: 20px; font-weight: bold; color: #10b981;">${reportData.benchmarks.topPerformers.toFixed(1)}%</div>
                  <div>Top Performers</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Security Score Trends</div>
              ${reportData.attempts.length > 0 ? `
                <table class="table">
                  <tr>
                    <th>Attempt</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Change</th>
                  </tr>
                  ${reportData.attempts.map(attempt => `
                    <tr>
                      <td>#${attempt.attemptNumber}</td>
                      <td>${new Date(attempt.completedAt).toLocaleDateString()}</td>
                      <td>${attempt.overallPercentage.toFixed(1)}%</td>
                      <td>${attempt.accuracyChange !== 0 ? `${attempt.accuracyChange >= 0 ? '+' : ''}${attempt.accuracyChange.toFixed(1)}%` : '-'}</td>
                    </tr>
                  `).join('')}
                </table>
              ` : '<p>No assessment history available.</p>'}
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Recommendations</div>
              ${reportData.recommendations.length > 0 ? `
                ${reportData.recommendations.map(rec => `
                  <div style="margin-bottom: 16px;">
                    <div style="display: flex; gap: 8px; margin-bottom: 4px;">
                      <span class="badge badge-blue">${rec.category}</span>
                      <span class="badge ${rec.priority === 'High' ? 'badge-red' : rec.priority === 'Medium' ? 'badge-yellow' : 'badge-green'}">${rec.priority}</span>
                    </div>
                    <h4 style="font-weight: bold;">${rec.issue}</h4>
                    <p>${rec.description}</p>
                    <p><strong>Action:</strong> ${rec.action}</p>
                  </div>
                `).join('')}
              ` : '<p>No recommendations available.</p>'}
            </div>
          </div>

          <div class="section">
            <div class="card">
              <div class="card-title">Compliance</div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; text-align: center;">
                ${[
                  { name: 'NIST Framework', status: reportData.overallScore >= 80 ? 'Compliant' : 'Partial' },
                  { name: 'ISO 27001', status: reportData.overallScore >= 85 ? 'Compliant' : 'Non-Compliant' },
                  { name: 'GDPR', status: reportData.overallScore >= 75 ? 'Compliant' : 'Partial' },
                  { name: 'SOC 2', status: reportData.overallScore >= 70 ? 'Partial' : 'Non-Compliant' }
                ].map(framework => `
                  <div>
                    <div style="font-size: 24px; margin-bottom: 8px;">🛡️</div>
                    <div style="font-weight: bold;">${framework.name}</div>
                    <span class="badge ${framework.status === 'Compliant' ? 'badge-green' : framework.status === 'Partial' ? 'badge-yellow' : 'badge-red'}">${framework.status}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    await page.addStyleTag({
      content: `
        @page { size: A4; margin: 20mm; }
        body { font-size: 12px; }
      `
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
    });

    await browser.close();
    return pdfBuffer;
  } catch (err) {
    console.error('PDF generation error:', err);
    throw new Error(`Failed to generate PDF: ${err.message}`);
  }
};

module.exports = generatePDF;