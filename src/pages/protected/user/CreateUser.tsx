// import UserForm from "@/components/users/UserForm"
import UserForm from "@/components/projects/UserForm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Link } from "react-router-dom"

const CreateUser = () => {
  return (
    <Card>
      <CardHeader className="flex justify-between">
        <h2 className="text-left">
          Add User
        </h2>

        <Button asChild variant="default">
          <Link to="/admin/users">Back</Link>
        </Button>
      </CardHeader>

      <CardContent>
        <UserForm />
      </CardContent>
    </Card>
  )
}

export default CreateUser
