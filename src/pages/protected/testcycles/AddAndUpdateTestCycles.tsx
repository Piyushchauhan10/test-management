import TestCyclesForm from '@/components/projects/TestCyclesForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import useHttp from '@/hooks/use-http'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const AddAndUpdateTestCycles = () => {
    const { projectId, sprintId, testCycleId } = useParams();

    const [testCycle, setTestCycle] = useState(null)

    const httpHook = useHttp();

    const getTestCycleById = async () => {
        try {
            const response = await httpHook.sendRequest(
                `${import.meta.env.VITE_BACKEND_API_URL}/TestCycles?$filter=ID eq '${testCycleId}'`
            )

            if (response?.success) {
                setTestCycle(response.data[0])
            }
        } catch (error) {
            console.error("Failed to fetch test cycle:", error)
        }
    }

    useEffect(() => {
        if (testCycleId) { getTestCycleById() }
    }, [testCycleId])
    return (
        <Card>
            <CardHeader className='flex justify-between'>
                <h2 className="text-left">
                    {testCycleId ? 'Edit' : 'Add'} Test Cycle
                </h2>
                <Button asChild variant="default">
                    <Link to={`/admin/project/${projectId}/sprint/${sprintId}`}>Back</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <TestCyclesForm testCycle={testCycle}/>
            </CardContent>
        </Card>
    )
}

export default AddAndUpdateTestCycles