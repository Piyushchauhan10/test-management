import ProjectForm from '@/components/projects/ProjectForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import useHttp from '@/hooks/use-http'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const ProjectAddUpdate = () => {

  const [project, setProject] = useState({
    name: "",
    description: ""
  })

  const httpHook = useHttp();

  let { id } = useParams();
 
  const getProjectById = async () => {
    try {
      const response = await httpHook.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Projects?$filter=ID eq '${id}'`
      )

      if (response?.success) {
        setProject(response.data[0])
      }
    } catch (error) {
      console.error("Failed to fetch project:", error)
    }
  }  

  useEffect(() => {
    if (id) {getProjectById()}
  }, [id])

  return (
    <Card>
      <CardHeader className='flex justify-between'>
        <h2 className="text-left">
          {id ? 'Edit' : 'Update'} Product
        </h2>
        <Button asChild variant="default">
          <Link to="/admin/project">Back</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ProjectForm id={id} project={{name: project.name, description: project.description}} />
      </CardContent>
    </Card>
  )
}

export default ProjectAddUpdate