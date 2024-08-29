import { auth } from '@/auth'
import { getEmployees } from '@/components/Employee/EmployeeActions'
import { EmployeeManagement } from '@/components/Employee/EmployeeManagement'
import { baseUrl } from '@/utils/constants'
import axios from 'axios'
import React from 'react'

export async function getRoles(token:string){
    try{
        const res= await fetch(baseUrl + "roles", {
            method:"GET",
            headers:{
                Authorization:"Bearer " + token
            },
            next:{tags:["getroles"]}
        })

        const data= await res.json()

        return data

    }catch(e:any){
        return e?.message
    }
}



const page = async() => {

  const employees = await getEmployees()
  console.log(employees)
    

  return (
    <div className='w-full min-h-screen'>
      <EmployeeManagement/>
    </div>
  )
}

export default page