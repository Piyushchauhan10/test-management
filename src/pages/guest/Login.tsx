import { LoginForm } from '@/components/login-form'
import { GalleryVerticalEnd } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const Login = () => {
    return (
        <div className="grid mx-auto lg:grid-cols-1">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        Test Management
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        <Card>
                            <CardContent>
                                <LoginForm />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login