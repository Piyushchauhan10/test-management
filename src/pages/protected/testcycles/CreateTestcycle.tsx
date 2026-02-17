import TestCycleForm from "@/components/projects/TestCycleForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Link, useParams } from "react-router-dom"

const CreateTestCycle = () => {
  const { projectId, sprintId } = useParams<{
    projectId: string
    sprintId: string
  }>()

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h2 className="text-left">Add Test Cycle</h2>

        <Button asChild variant="default">
          <Link
            to={`/admin/project/${projectId}/sprint/${sprintId}/test-cycles`}
          >
            Back
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        <TestCycleForm update={true} />
      </CardContent>
    </Card>
  )
}

export default CreateTestCycle
