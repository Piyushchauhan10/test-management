import SprintForm from '@/components/projects/SprintForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link } from 'react-router-dom'

const CreateSprint = () => {
    return (
        <Card>
            <CardHeader className='flex justify-between'>
                <h2 className="text-left">
                    Add Sprint
                </h2>
                <Button asChild variant="default">
                    <Link to="/admin/project">Back</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <SprintForm update={false} />
            </CardContent>
        </Card>
    )
}

export default CreateSprint