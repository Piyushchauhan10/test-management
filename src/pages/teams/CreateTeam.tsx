
import TeamForm from "@/components/projects/TeamForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Link } from "react-router-dom"

const CreateTeam = () => {
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h2 className="text-left text-xl font-semibold">
          Add Team
        </h2>

        <Button asChild variant="default">
          <Link to="/admin/teams">Back</Link>
        </Button>
      </CardHeader>

      <CardContent>
        <TeamForm />
      </CardContent>
    </Card>
  )
}

export default CreateTeam
