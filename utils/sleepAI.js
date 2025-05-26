/**
 * utils/sleepAI.js
 * ระบบ AI อย่างง่ายสำหรับวิเคราะห์ข้อมูลการนอนแบบฟรี
 */

/**
 * วิเคราะห์รูปแบบการนอนจากข้อมูลประวัติการนอน
 * @param {Array} sleepRecords ข้อมูลการนอนย้อนหลัง
 * @param {Object} sleepGoals เป้าหมายการนอนของผู้ใช้
 * @return {Object} ผลการวิเคราะห์และคำแนะนำ
 */
exports.analyzeSleepPatterns = (sleepRecords, sleepGoals) => {
  // Default empty result with all required properties
  const defaultResult = {
    message: 'ยังไม่มีข้อมูลการนอนเพียงพอสำหรับการวิเคราะห์',
    insights: [],
    recommendations: [
      'เพิ่มข้อมูลการนอนของคุณเพื่อรับคำวิเคราะห์ที่แม่นยำขึ้น',
      'ควรบันทึกข้อมูลการนอนอย่างน้อย 7 วันเพื่อให้ได้ผลวิเคราะห์ที่ดี'
    ],
    stats: {
      averageDuration: 0,
      averageDurationHours: '0.0',
      avgDurationHours: '0.0', // For compatibility
      averageBedTime: '00:00',
      averageWakeTime: '00:00',
      consistencyScore: 0,
      lowSleepPercentage: 0,
      daysAnalyzed: 0,
      hasWeekendCompensation: false,
      weekdayAvgDuration: 0,
      weekendAvgDuration: 0,
    }
  };

  if (!sleepRecords || sleepRecords.length === 0) {
    return defaultResult;
  }

  try {
    // คัดกรองข้อมูลเฉพาะ 30 วันล่าสุด
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    const recentRecords = sleepRecords
      .filter(record => new Date(record.bedTime) >= cutoffDate)
      .sort((a, b) => new Date(b.bedTime) - new Date(a.bedTime));

    // ถ้ามีข้อมูลน้อยเกินไป
    if (recentRecords.length < 3) {
      defaultResult.message = 'ข้อมูลการนอนยังไม่เพียงพอ ต้องการข้อมูลอย่างน้อย 3 วัน';
      defaultResult.stats.daysAnalyzed = recentRecords.length;
      return defaultResult;
    }

    // คำนวณข้อมูลพื้นฐาน
    const targetHours = sleepGoals?.targetHours || 8;
    const bedTimeTarget = sleepGoals?.bedTimeTarget || '23:00';
    const wakeTimeTarget = sleepGoals?.wakeTimeTarget || '07:00';

    // ค่าเฉลี่ยระยะเวลานอน
    const avgDuration = recentRecords.reduce((sum, record) => sum + record.durationMinutes, 0) / recentRecords.length;
    const avgDurationHours = (avgDuration / 60).toFixed(1);
    
    // ค่าเฉลี่ยเวลาเข้านอน
    const bedTimes = recentRecords.map(record => {
      const date = new Date(record.bedTime);
      return date.getHours() * 60 + date.getMinutes(); // แปลงเป็นนาทีนับจากเที่ยงคืน
    });
    
    const avgBedTimeMinutes = bedTimes.reduce((sum, time) => sum + time, 0) / bedTimes.length;
    const avgBedTimeHours = Math.floor(avgBedTimeMinutes / 60);
    const avgBedTimeMins = Math.floor(avgBedTimeMinutes % 60);
    
    // ป้องกันค่า NaN
    const formattedAvgBedTime = !isNaN(avgBedTimeHours) && !isNaN(avgBedTimeMins) 
      ? `${avgBedTimeHours.toString().padStart(2, '0')}:${avgBedTimeMins.toString().padStart(2, '0')}`
      : '00:00';
    
    // ค่าเฉลี่ยเวลาตื่นนอน
    const wakeTimes = recentRecords.map(record => {
      const date = new Date(record.wakeTime);
      return date.getHours() * 60 + date.getMinutes();
    });
    
    const avgWakeTimeMinutes = wakeTimes.reduce((sum, time) => sum + time, 0) / wakeTimes.length;
    const avgWakeTimeHours = Math.floor(avgWakeTimeMinutes / 60);
    const avgWakeTimeMins = Math.floor(avgWakeTimeMinutes % 60);
    const formattedAvgWakeTime = `${avgWakeTimeHours.toString().padStart(2, '0')}:${avgWakeTimeMins.toString().padStart(2, '0')}`;
    
    // คำนวณความสม่ำเสมอของเวลานอน (ความเบี่ยงเบนมาตรฐาน)
    const bedTimeVariance = bedTimes.reduce((sum, time) => sum + Math.pow(time - avgBedTimeMinutes, 2), 0) / bedTimes.length;
    const bedTimeStdDev = Math.sqrt(bedTimeVariance);
    const consistencyScore = 100 - Math.min(100, Math.round(bedTimeStdDev / 2));
    
    // วิเคราะห์แนวโน้ม
    const isEnoughSleep = avgDuration >= (targetHours * 60 - 30); // ความคลาดเคลื่อน 30 นาที
    const isConsistent = consistencyScore >= 70;
    
    // นับจำนวนวันที่นอนน้อยเกินไป
    const lowSleepDays = recentRecords.filter(record => record.durationMinutes < targetHours * 60 - 60).length;
    const lowSleepPercentage = Math.round((lowSleepDays / recentRecords.length) * 100);
    
    // วิเคราะห์รูปแบบวันธรรมดา/วันหยุด
    const weekdayRecords = recentRecords.filter(record => {
      const date = new Date(record.bedTime);
      const day = date.getDay();
      return day >= 1 && day <= 5;  // วันจันทร์ถึงวันศุกร์
    });
    
    const weekendRecords = recentRecords.filter(record => {
      const date = new Date(record.bedTime);
      const day = date.getDay();
      return day === 0 || day === 6;  // วันเสาร์และวันอาทิตย์
    });
    
    let weekdayAvgDuration = 0;
    let weekendAvgDuration = 0;
    
    if (weekdayRecords.length > 0) {
      weekdayAvgDuration = weekdayRecords.reduce((sum, record) => sum + record.durationMinutes, 0) / weekdayRecords.length;
    }
    
    if (weekendRecords.length > 0) {
      weekendAvgDuration = weekendRecords.reduce((sum, record) => sum + record.durationMinutes, 0) / weekendRecords.length;
    }
    
    const weekdayWeekendDiff = Math.abs(weekdayAvgDuration - weekendAvgDuration);
    const hasWeekendCompensation = weekdayRecords.length > 0 && weekendRecords.length > 0 && weekendAvgDuration > weekdayAvgDuration + 60;

    // สร้างข้อมูลเชิงลึก
    const insights = [];
    const recommendations = [];
    
    // ข้อมูลเชิงลึกพื้นฐาน
    insights.push(`ระยะเวลานอนเฉลี่ยของคุณคือ ${avgDurationHours} ชั่วโมงต่อคืน`);
    insights.push(`คุณมักเข้านอนเวลา ${formattedAvgBedTime} และตื่นนอนเวลา ${formattedAvgWakeTime}`);
    insights.push(`คุณนอนน้อยกว่าเป้าหมาย (${targetHours} ชั่วโมง) ${lowSleepPercentage}% ของเวลา`);
    
    if (consistencyScore >= 85) {
      insights.push(`ความสม่ำเสมอในการนอนของคุณอยู่ในเกณฑ์ดีมาก (${consistencyScore}%)`);
    } else if (consistencyScore >= 70) {
      insights.push(`ความสม่ำเสมอในการนอนของคุณอยู่ในเกณฑ์ดี (${consistencyScore}%)`);
    } else {
      insights.push(`ความสม่ำเสมอในการนอนของคุณต่ำกว่าเกณฑ์ (${consistencyScore}%)`);
    }
    
    if (hasWeekendCompensation) {
      insights.push(`คุณมักนอนชดเชยในวันหยุดสุดสัปดาห์ มากกว่าวันธรรมดาประมาณ ${Math.round(weekdayWeekendDiff / 60)} ชั่วโมง`);
    }
    
    // คำแนะนำตามผลวิเคราะห์
    if (!isEnoughSleep) {
      recommendations.push(`พยายามนอนให้ได้อย่างน้อย ${targetHours} ชั่วโมงต่อคืน เพื่อสุขภาพที่ดี`);
    }
    
    if (!isConsistent) {
      recommendations.push('พยายามเข้านอนและตื่นนอนในเวลาเดียวกันทุกวัน แม้ในวันหยุดสุดสัปดาห์');
    }
    
    if (hasWeekendCompensation) {
      recommendations.push('การนอนชดเชยในวันหยุดสุดสัปดาห์อาจทำให้เกิดภาวะ "social jet lag" ซึ่งส่งผลเสียต่อสุขภาพ');
    }
    
    const [targetBedHour, targetBedMinute] = bedTimeTarget.split(':').map(num => parseInt(num, 10));
    const targetBedTimeMinutes = targetBedHour * 60 + targetBedMinute;
    
    const bedTimeDiff = Math.abs(avgBedTimeMinutes - targetBedTimeMinutes);
    if (bedTimeDiff > 30) {
      recommendations.push(`พยายามเข้านอนใกล้เคียงกับเป้าหมายของคุณ (${bedTimeTarget}) ให้มากขึ้น`);
    }
    
    // เพิ่มคำแนะนำทั่วไปเกี่ยวกับการนอนหลับที่ดี
    const generalTips = [
      'หลีกเลี่ยงการใช้หน้าจอ (โทรศัพท์, คอมพิวเตอร์, ทีวี) 1-2 ชั่วโมงก่อนนอน',
      'หลีกเลี่ยงคาเฟอีนในช่วงบ่ายและเย็น',
      'ออกกำลังกายอย่างสม่ำเสมอ แต่หลีกเลี่ยงการออกกำลังกายหนักก่อนนอน',
      'ทำให้ห้องนอนมืด เงียบ และเย็นสบาย',
      'สร้างกิจวัตรก่อนนอนที่ช่วยให้ผ่อนคลาย เช่น อ่านหนังสือ หรือทำสมาธิ'
    ];
    
    // เลือกคำแนะนำทั่วไป 1-2 ข้อตามความเหมาะสม
    if (recommendations.length < 3) {
      const numTipsToAdd = 3 - recommendations.length;
      for (let i = 0; i < numTipsToAdd && i < generalTips.length; i++) {
        recommendations.push(generalTips[i]);
      }
    }
    
    // สร้างข้อความสรุป
    let message = '';
    if (isEnoughSleep && isConsistent) {
      message = 'รูปแบบการนอนของคุณอยู่ในเกณฑ์ดี ให้รักษาสุขนิสัยการนอนที่ดีนี้ต่อไป';
    } else if (isEnoughSleep) {
      message = 'คุณนอนหลับได้เพียงพอ แต่ควรปรับปรุงความสม่ำเสมอของการนอน';
    } else if (isConsistent) {
      message = 'คุณมีความสม่ำเสมอในการนอนดี แต่ควรเพิ่มระยะเวลาการนอนให้มากขึ้น';
    } else {
      message = 'คุณควรปรับปรุงทั้งระยะเวลาและความสม่ำเสมอในการนอนเพื่อสุขภาพที่ดีขึ้น';
    }
    
    // สร้าง stats object ที่สมบูรณ์ และมีค่าเริ่มต้นเพื่อป้องกัน undefined
    const stats = {
      averageDuration: avgDuration || 0,
      averageDurationHours: avgDurationHours || '0.0',
      avgDurationHours: avgDurationHours || '0.0', // For compatibility
      averageBedTime: formattedAvgBedTime || '00:00',
      averageWakeTime: formattedAvgWakeTime || '00:00',
      consistencyScore: consistencyScore || 0,
      lowSleepPercentage: lowSleepPercentage || 0,
      daysAnalyzed: recentRecords.length || 0,
      hasWeekendCompensation: hasWeekendCompensation || false,
      weekdayAvgDuration: (weekdayAvgDuration / 60) || 0,
      weekendAvgDuration: (weekendAvgDuration / 60) || 0,
    };
    
    return {
      message,
      insights: insights || [],
      recommendations: recommendations || [],
      stats
    };
  } catch (error) {
    console.error('Error in analyzeSleepPatterns:', error);
    return defaultResult;
  }
};

/**
 * ให้คำแนะนำเฉพาะบุคคลตามข้อมูลการนอนล่าสุด
 * @param {Object} record ข้อมูลการนอนล่าสุด
 * @param {Object} goals เป้าหมายการนอน
 * @param {Object} analytics ข้อมูลวิเคราะห์จาก analyzeSleepPatterns
 * @return {Object} คำแนะนำสำหรับวันนี้
 */
exports.getDailyRecommendation = (record, goals, analytics) => {
  // Default response if data is insufficient
  const defaultResponse = {
    title: 'ยังไม่มีข้อมูลเพียงพอ',
    message: 'บันทึกข้อมูลการนอนของคุณเพื่อรับคำแนะนำที่เหมาะสม',
    actionItems: []
  };

  if (!record || !goals) {
    return defaultResponse;
  }

  try {
    const targetHours = goals.targetHours || 8;
    const durationHours = record.durationMinutes / 60;
    const sleepDeficit = targetHours - durationHours;
    
    let title = '';
    let message = '';
    const actionItems = [];
    
    // วิเคราะห์ระยะเวลาการนอน
    if (sleepDeficit >= 2) {
      title = 'คุณนอนน้อยเกินไปเมื่อคืน';
      message = `คุณนอนน้อยกว่าเป้าหมาย ${sleepDeficit.toFixed(1)} ชั่วโมง ควรพยายามเข้านอนเร็วขึ้นคืนนี้`;
      actionItems.push('พยายามเข้านอนเร็วขึ้นอย่างน้อย 1 ชั่วโมงในคืนนี้');
      actionItems.push('หลีกเลี่ยงการดื่มเครื่องดื่มที่มีคาเฟอีนหลังเที่ยง');
    } else if (sleepDeficit >= 1) {
      title = 'คุณนอนน้อยกว่าเป้าหมายเล็กน้อย';
      message = `คุณนอนน้อยกว่าเป้าหมายประมาณ ${sleepDeficit.toFixed(1)} ชั่วโมง`;
      actionItems.push('พยายามเข้านอนให้ตรงเวลาในคืนนี้');
    } else if (sleepDeficit <= -2) {
      title = 'คุณนอนมากเกินไป';
      message = 'การนอนมากเกินไปอาจส่งผลเสียต่อคุณภาพการนอนในคืนถัดไป';
      actionItems.push('ลองตั้งนาฬิกาปลุกให้สอดคล้องกับวงจรการนอนหลับ (ประมาณ 7-9 ชั่วโมง)');
    } else {
      title = 'คุณมีการนอนที่เหมาะสม';
      message = 'คุณนอนหลับได้ใกล้เคียงกับเป้าหมาย ทำดีแล้ว!';
    }
    
    // วิเคราะห์เวลาเข้านอน
    const bedTime = new Date(record.bedTime);
    const bedHour = bedTime.getHours();
    
    if (bedHour >= 0 && bedHour < 3) {
      actionItems.push('คุณเข้านอนค่อนข้างดึก พยายามเข้านอนก่อนเที่ยงคืนจะดีต่อสุขภาพมากกว่า');
    }
    
    // เพิ่มคำแนะนำตามความเหมาะสม
    if (record.interruptions > 2) {
      actionItems.push('คุณตื่นระหว่างนอนบ่อย ลองตรวจสอบสภาพแวดล้อมการนอน เช่น เสียง แสง อุณหภูมิ');
    }
    
    if (record.timeToFallAsleep > 30) {
      actionItems.push('คุณใช้เวลานานในการเข้านอน ลองฝึกการผ่อนคลายก่อนนอน เช่น การหายใจลึกๆ หรือการทำสมาธิ');
    }
    
    return {
      title,
      message,
      actionItems
    };
  } catch (error) {
    console.error('Error in getDailyRecommendation:', error);
    return defaultResponse;
  }
};

/**
 * ตรวจหาปัญหาการนอนที่อาจต้องปรึกษาแพทย์
 * @param {Array} sleepRecords ข้อมูลการนอนย้อนหลัง
 * @return {Array} ปัญหาที่พบและควรปรึกษาแพทย์
 */
exports.detectSleepIssues = (sleepRecords) => {
  if (!sleepRecords || sleepRecords.length < 7) {
    return [];
  }
  
  try {
    const issues = [];
    
    // นับจำนวนวันที่มีปัญหาต่างๆ
    let lowSleepCount = 0;
    let highInterruptionCount = 0;
    let longFallAsleepCount = 0;
    
    sleepRecords.slice(0, 14).forEach(record => {
      if (record.durationMinutes < 6 * 60) {
        lowSleepCount++;
      }
      
      if (record.interruptions && record.interruptions >= 4) {
        highInterruptionCount++;
      }
      
      if (record.timeToFallAsleep && record.timeToFallAsleep >= 45) {
        longFallAsleepCount++;
      }
    });
    
    // ตรวจหาปัญหาที่เกิดขึ้นซ้ำๆ
    if (lowSleepCount >= 5) {
      issues.push({
        type: 'low_sleep',
        message: 'คุณมีอาการนอนน้อยเรื้อรัง (Chronic Sleep Deprivation) ซึ่งส่งผลเสียต่อสุขภาพในระยะยาว',
        severity: 'medium'
      });
    }
    
    if (highInterruptionCount >= 4) {
      issues.push({
        type: 'high_interruption',
        message: 'คุณตื่นบ่อยระหว่างการนอนหลายคืน อาจเป็นสัญญาณของภาวะนอนไม่หลับ หรือโรคอื่นๆ',
        severity: 'medium'
      });
    }
    
    if (longFallAsleepCount >= 5) {
      issues.push({
        type: 'insomnia',
        message: 'คุณมีอาการนอนไม่หลับ ใช้เวลานานในการเข้านอนหลายคืน',
        severity: 'medium'
      });
    }
    
    return issues;
  } catch (error) {
    console.error('Error in detectSleepIssues:', error);
    return [];
  }
};

module.exports = {
  analyzeSleepPatterns: exports.analyzeSleepPatterns,
  getDailyRecommendation: exports.getDailyRecommendation,
  detectSleepIssues: exports.detectSleepIssues
}; 