import DefectForm from "@/components/projects/DefectForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Link } from "react-router-dom"

const CreateDefect = () => {
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2>Add Defect</h2>

        <Button asChild>
          <Link to="/admin/defects">Back</Link>
        </Button>
      </CardHeader>

      <CardContent>
        <DefectForm update={false} />
      </CardContent>
    </Card>
  )
}

export default CreateDefect