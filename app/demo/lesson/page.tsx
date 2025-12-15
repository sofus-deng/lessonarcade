import { redirect } from 'next/navigation'

export default function DemoLessonPage() {
  // Redirect to the default demo lesson
  redirect('/demo/lesson/react-hooks-intro')
}