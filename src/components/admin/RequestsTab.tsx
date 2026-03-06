import { useState } from 'react';
import { useRequestStore } from '@/store/requestStore';
import { Button } from '@/components/common/Button';
import type { RequestStatus } from '@/types/request';

export function RequestsTab() {
  const { requests, approveRequest, rejectRequest } = useRequestStore();
  const [filter, setFilter] = useState<RequestStatus | 'all'>('pending');
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const sorted = [...filtered].sort((a, b) => b.requestedAt - a.requestedAt);

  const statusLabel: Record<RequestStatus, string> = { pending: '待审核', approved: '已批准', rejected: '已拒绝' };
  const statusColor: Record<RequestStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <Button key={s} size="sm" variant={filter === s ? 'primary' : 'secondary'} onClick={() => setFilter(s)}>
            {s === 'all' ? '全部' : statusLabel[s]}
          </Button>
        ))}
      </div>

      {sorted.length === 0 && <p className="text-gray-400 text-sm">暂无申请</p>}

      {sorted.map(req => (
        <div key={req.id} className="border rounded-xl p-4 flex flex-col gap-3 bg-white">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-800">
              {req.requestType === 'delete' ? '删除' : '修改'}申请 — {req.originalSnapshot.courseName}
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[req.status]}`}>
              {statusLabel[req.status]}
            </span>
          </div>

          <div className="text-sm text-gray-500">
            申请人：{req.requesterUsername} · {new Date(req.requestedAt).toLocaleString('zh-CN')}
          </div>

          {/* Original */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="font-medium text-gray-600 mb-1">原始课程</div>
            <div className="grid grid-cols-2 gap-1 text-gray-700">
              <span>课程：{req.originalSnapshot.courseName}</span>
              <span>队伍：{req.originalSnapshot.teamName}</span>
              <span>日期：{req.originalSnapshot.date}</span>
              <span>时间：{req.originalSnapshot.startTime}–{req.originalSnapshot.endTime}</span>
            </div>
          </div>

          {/* Proposed (modify only) */}
          {req.requestType === 'modify' && Object.keys(req.proposed).length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 text-sm">
              <div className="font-medium text-blue-600 mb-1">申请变更为</div>
              <div className="grid grid-cols-2 gap-1 text-blue-800">
                {req.proposed.courseName && <span>课程：{req.proposed.courseName}</span>}
                {req.proposed.teamName && <span>队伍：{req.proposed.teamName}</span>}
                {req.proposed.date && <span>日期：{req.proposed.date}</span>}
                {(req.proposed.startTime || req.proposed.endTime) && (
                  <span>时间：{req.proposed.startTime}–{req.proposed.endTime}</span>
                )}
              </div>
            </div>
          )}

          {req.status === 'pending' && (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="备注（可选）"
                value={noteMap[req.id] ?? ''}
                onChange={e => setNoteMap(m => ({ ...m, [req.id]: e.target.value }))}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-400"
              />
              <Button size="sm" variant="primary" onClick={() => approveRequest(req.id, noteMap[req.id])}>批准</Button>
              <Button size="sm" variant="danger" onClick={() => rejectRequest(req.id, noteMap[req.id])}>拒绝</Button>
            </div>
          )}

          {req.status !== 'pending' && req.adminNote && (
            <div className="text-sm text-gray-500">备注：{req.adminNote}</div>
          )}
        </div>
      ))}
    </div>
  );
}
