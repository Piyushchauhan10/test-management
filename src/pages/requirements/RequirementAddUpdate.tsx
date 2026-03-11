import RequirementForm from '@/components/projects/RequirementForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Link } from 'react-router-dom'

const CreateRequirement = () => {
    return (
        <Card>
            <CardHeader className='flex justify-between'>
                <h2 className="text-left">
                    Add Requirement
                </h2>
                <Button asChild variant="default">
                    <Link to="/admin/project">Back</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <RequirementForm update={false}/>
            </CardContent>
        </Card>
    )
}

export default CreateRequirement