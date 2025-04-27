import Header from '@/components/template/Header'
import UserProfileDropdown from '@/components//template/UserProfileDropdown'
import HeaderLogo from '@/components/template/HeaderLogo'
import MobileNav from '@/components/template/MobileNav'
import HorizontalNav from '@/components/template/HorizontalNav'
import LayoutBase from '@/components//template/LayoutBase'
import useResponsive from '@/utils/hooks/useResponsive'
import { LAYOUT_TOP_BAR_CLASSIC } from '@/constants/theme.constant'
import type { CommonProps } from '@/@types/common'
import Clock from '@/components/custom/Clock/Clock'
import GoogleTranslate from '@/components/custom/GoogleTranslate'
// import LangSelect from '@/components/custom/LangSelect'
// import GoogleTranslate from './GoogleTranslate'

const TopBarClassic = ({ children }: CommonProps) => {
    const { larger, smaller } = useResponsive()

    return (
        <LayoutBase
            type={LAYOUT_TOP_BAR_CLASSIC}
            className="app-layout-top-bar-classic flex flex-auto flex-col min-h-screen"
        >
            <div className="flex flex-auto min-w-0">
                <div className="flex flex-col flex-auto min-h-screen min-w-0 relative w-full">
                    <Header
                        container
                        style={{backgroundColor:"#A4E8E0"}}
                        className="shadow dark:shadow-2xl bg-stone-300"
                        headerStart={
                            <>
                                {smaller.lg && <MobileNav />}
                                <HeaderLogo />
                                <div className='text-3xl  font-bold text-green-700'>Smart Agri</div>
                            </>
                        }
                        headerMiddle={<>{larger.lg && <HorizontalNav />}</>}
                        headerEnd={
                            <>
                                <Clock/>
                                <GoogleTranslate /> 
                            </>
                        }
                    />
                    {children}
                </div>
            </div>
        </LayoutBase>
    )
}

export default TopBarClassic
