'use client'

import PageLayout from '@/components/layout/PageLayout'
import TaskList from '@/components/tasks/TaskList'

export default function TasksPage() {
  return (
    <PageLayout title="Zadania">
      <TaskList />
    </PageLayout>
  )
}
