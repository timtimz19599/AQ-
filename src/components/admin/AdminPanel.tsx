import { useState } from 'react';
import { StatisticsTab } from './StatisticsTab';
import { SettingsTab } from './SettingsTab';
import { CoursesTab } from './CoursesTab';
import { TeachersTab } from './TeachersTab';

type Tab = 'courses' | 'teachers' | 'statistics' | 'settings';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('courses');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'courses', label: '课程管理' },
    { id: 'teachers', label: '教师管理' },
    { id: 'statistics', label: '课时统计' },
    { id: 'settings', label: '系统设置' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 border-b border-[#e2e8f0]">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors relative ${
              activeTab === t.id
                ? 'text-[#1e3a5f] border-b-2 border-[#1e3a5f] -mb-px'
                : 'text-[#64748b] hover:text-[#0f172a]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>
        {activeTab === 'courses' && <CoursesTab />}
        {activeTab === 'teachers' && <TeachersTab />}
        {activeTab === 'statistics' && <StatisticsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
