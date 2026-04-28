import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBroadcast } from '../hooks/useBroadcast';
import LivePlayer from '../components/broadcast/LivePlayer';

export default function BroadcastPage() {
  const { teacherId } = useParams();
  const [subject, setSubject] = useState('');
  const { data, isLoading, isEmpty, countdown } = useBroadcast(teacherId, subject);

  return (
    <LivePlayer
      data={data}
      isEmpty={isEmpty}
      isLoading={isLoading}
      countdown={countdown}
      subject={subject}
      onSubjectChange={setSubject}
    />
  );
}
