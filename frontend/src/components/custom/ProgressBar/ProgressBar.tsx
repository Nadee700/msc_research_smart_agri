
import Progress from '@/components/ui/Progress'
import { HiXCircle, HiCheckCircle } from 'react-icons/hi'

const CircleCustomInfo = ({ percent }: { percent: number }) => {
    return (
        <div className="text-center">
            <h3>{percent}%</h3>
        </div>
    )
}

const CustomInfo = () => {
    return (
        <div className="md:flex items-center mb-0 mb-0">
            <div style={{ minWidth: '50%' }} className="md:mb-0 mb-4 mx-6">
                <Progress
                    customColorClass="bg-green-500"
                    percent={50}
                    customInfo={
                        <HiCheckCircle className="text-emerald-500 text-xl" />
                    }
                />
            </div>
            <Progress
                variant="circle"
                percent={30}
                width={85}
                customInfo={<CircleCustomInfo percent={30} />}
            />
            <div>
                <h3 style={{ textAlign: 'center' }} className='md:mb-0 mb-2 mx-48'>hhh</h3>
            </div>
        </div>
    )
}

export default CustomInfo

