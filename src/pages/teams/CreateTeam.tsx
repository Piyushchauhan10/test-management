import TeamForm from "@/components/projects/TeamForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Link, useParams } from "react-router-dom"

const CreateTeam = () => {
  const { id } = useParams()
  const update = !!id

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h2 className="text-left">
          {update ? "Edit Team" : "Add Team"}
        </h2>

        <Button asChild variant="default">
          <Link to="/admin/teams">Back</Link>
        </Button>
      </CardHeader>

      <CardContent>
        <TeamForm update={update} teamId={id} />
      </CardContent>
    </Card>
  )
}

export default CreateTeam