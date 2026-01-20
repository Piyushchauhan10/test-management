import UserForm from "@/components/projects/UserForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Link, useParams } from "react-router-dom"

const CreateUser = () => {
  const { id } = useParams()
  const update = Boolean(id)

  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h2>{update ? "Edit User" : "Add User"}</h2>

        <Button asChild>
          <Link to="/admin/users">Back</Link>
        </Button>
      </CardHeader>

      <CardContent>
        <UserForm update={update} userId={id} />
      </CardContent>
    </Card>
  )
}

export default CreateUser
