'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/shadcn/ui/button"
import { Input } from "@/shadcn/ui/input"
import { Label } from "@/shadcn/ui/label"
import { Textarea } from "@/shadcn/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shadcn/ui/select"
import { Calendar } from "@/shadcn/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/shadcn/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shadcn/ui/tabs"
import { Badge } from "@/shadcn/ui/badge"
import { toast } from "@/shadcn/ui/use-toast"
import { format } from 'date-fns'
import { AlertCircle, CheckCircle2, Clock, MapPin, User, Calendar as CalendarIcon, ArrowLeft, ArrowRight, Save, Edit, X, Check } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/shadcn/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shadcn/ui/dialog"
import React from 'react'
import { cn } from '@/lib/utils'
import { baseUrl } from '@/utils/constants'
import { useSession } from 'next-auth/react'

type Step = 'create' | 'schedule' | 'assign' | 'review'
type JobStatus = 'Draft' | 'Not Assigned' | 'Assigned' | 'In Progress' | 'Completed'


interface Job { 
  id:string 
  name: string
  description: string
  type: string
  clientId: string[]  
  technicianId: string[]
  jobSchedule:{
    startDate: Date | null
    endDate: Date | null
    recurrence: string
  } 
  location: {
    city: string;
    state: string;
    zip: string;
    
  };
  
}

interface Client {
  id: string
  name: string
}

const recurrenceOptions = ["DAILY", "WEEKLY", "MONTHLY"]



export default function JobManagement({ customers, employee, jobtype }: { customers: any; employee: any; jobtype: any }) {
  const [step, setStep] = useState<Step>('create')
  const [jobs, setJobs] = useState<Job[]>([])
  const [currentJob, setCurrentJob] = useState<Job>({
    id:'',
    name: '',
    description: '',    
    type: '',
    clientId: [],     
    technicianId: [],
    location: {
      city: '',
      state: '',
      zip: '',
     
    },
    jobSchedule:{
      startDate: new Date(),  
      endDate: new Date(),
      recurrence: 'None',

    }
    
  })



  const [editingJobId, setEditingJobId] = useState<string | null>(null)

  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);


  const [openClientSearch, setOpenClientSearch] = React.useState(false)
  const [clientSearch, setClientSearch] = React.useState("")
  const [selectedClients, setSelectedClients] = React.useState<Client[]>([])

  const handleSelectClient = (client: { id: string; name: string }) => {
    setSelectedClients((prev) => {
      const isSelected = prev.some((c) => c.id === client.id)
      if (isSelected) {
        return prev.filter((c) => c.id !== client.id)
      } else {
        return [...prev, client]
      }
    })
  }
  const { data: session } = useSession();

  console.log(session, "session")

  const removeClient = (clientId: string) => {
    setSelectedClients((prev) => prev.filter((c) => c.id !== clientId))
  }

  const [openTechnicianSearch, setOpenTechnicianSearch] = React.useState(false)
  const [technicianSearch, setTechnicianSearch] = React.useState("")
  const [selectedTechnicians, setSelectedTechnicians] = React.useState<{id: string, name: string}[]>([])

const handleSelectTechnician = (technician: { id: string; name: string }) => {
  setSelectedTechnicians((prev) => {
    const isSelected = prev.some((t) => t.id === technician.id)
    if (isSelected) {
      return prev.filter((t) => t.id !== technician.id)
    } else {
      return [...prev, technician]
    }
  })
}


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCurrentJob({ ...currentJob, [e.target.name]: e.target.value })
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentJob({ 
      ...currentJob, 
      location: { ...currentJob.location, [e.target.name]: e.target.value } 
    })
  }

  const handleSelectChange = (value: string, field: keyof Job) => {
    setCurrentJob({ ...currentJob, [field]: value })
  }

  const handleDateChange = (date: any, field: 'startDate' | 'endDate') => {
    setCurrentJob({ ...currentJob, [field]: date });
    if (field === 'startDate') setShowStartCalendar(false);
    else setShowEndCalendar(false);
  };
  const validateStep = () => {
    switch (step) {
      case 'create':
        return currentJob.name && currentJob.description && currentJob.type && currentJob.clientId      
      case 'schedule':
        return currentJob.jobSchedule.startDate && currentJob.jobSchedule.endDate && currentJob.jobSchedule.recurrence
      case 'assign':
        return currentJob.technicianId
      default:
        return true
    }
  }

  

  const handleNext = () => {
    if (!validateStep()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive",
      })
      return
    }

    switch (step) {
      case 'create':
        setStep('schedule')
        break
      case 'schedule':
        setStep('assign')
        break
      case 'assign':
        setStep('review')
        break
    }
  }

  const handleBack = () => {
    switch (step) {
      case 'schedule':
        setStep('create')
        break
      case 'assign':
        setStep('schedule')
        break
      case 'review':
        setStep('assign')
        break
    }
  }
  const handleSubmit = async () => {
    if (!validateStep()) return;

  
    let updatedJob = {
      ...currentJob,
      clientId: selectedClients.map((client) => client.id),
      technicianId: selectedTechnicians.map((tech) => tech.id),
      jobTypeId: currentJob.type, 
      companyId: session?.user.companyId,
      dispatcherId: session?.user.userId   
       
      
    };
   

    let dataToSend = {  
      name: updatedJob.name,
      description: updatedJob.description,
      jobTypeId: updatedJob.jobTypeId,
      location:updatedJob.location,
      clientId: updatedJob.clientId, 
      companyId:updatedJob.companyId,
      dispatcherId:updatedJob.dispatcherId,
      technicianId :updatedJob.technicianId}

      console.log(dataToSend, "send this data")


    
  
  
    console.log("Submitting Job:", updatedJob); 
  
    try {
      const method = editingJobId ? 'PUT' : 'POST';
      const endpoint = baseUrl + 'job';
  
      console.log(`Sending request to ${endpoint} with method ${method}`); // Log endpoint and method
  
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.user.access_token}`,
        },
        body: JSON.stringify(dataToSend),
      });
  
      console.log("Response status:", response.status); // Log response status
  
      if (!response.ok) {
        const errorResponse = await response.json();
        console.log("Error response:", errorResponse); // Log the error response
        throw new Error('Failed to submit job data');
      }
  
      const result = await response.json();
      console.log("Successful result:", result); // Log the successful result
  
      toast({
        title: editingJobId ? "Job Updated" : "Job Created",
        description: editingJobId ? "The job has been successfully updated." : "The new job has been successfully created and assigned.",
      });
  
      setJobs(editingJobId ? jobs.map(job => job.id === editingJobId ? result : job) : [...jobs, result]);
      setEditingJobId(null);
      setCurrentJob({
        id: '',
        name: '',
        description: '',
        type: '',
        clientId: [],
        jobSchedule:{startDate: new Date(),endDate: new Date(),recurrence: 'None',},   
        technicianId: [],
        location: { city: '', zip: '', state: '' },
      });
      setStep('create');
    } catch (error) {
      console.error("Error submitting job:", error); // Log the caught error
      toast({
        title: "Submission Error",
        variant: "destructive",
      });
    }
  };  

  const handleSaveDraft = () => {
    localStorage.setItem('jobDraft', JSON.stringify(currentJob))
    toast({
      title: "Draft Saved",
      description: "Your job draft has been saved. You can continue editing later.",
    })
  }

  const handleEditJob = (job: Job) => {
    setCurrentJob(job)
    setEditingJobId(job.id)
    setStep('create')
  }

  const filteredClients = customers.filter((client: { id: string; name: string }) =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const renderStep = () => {
    switch (step) {
      case 'create':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Job Name</Label>
              <Input id="name" name="name" value={currentJob.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" value={currentJob.description} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="type">Job Type</Label>
              <Select value={currentJob.type} onValueChange={(value) => handleSelectChange(value, 'type')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobtype.map((type:any) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
<div>
      <Label htmlFor="clients">Clients</Label>
      <Popover open={openClientSearch} onOpenChange={setOpenClientSearch}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openClientSearch}
            className="w-full justify-between"
          >
            {selectedClients.length > 0 ? `${selectedClients.length} selected` : "Select clients..."}
            <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search clients..." onValueChange={setClientSearch} />
            <CommandList>
              <CommandEmpty>No client found.</CommandEmpty>
              <CommandGroup>
                {filteredClients.map((client: { id: string; name: string }) => (
                  <CommandItem
                    key={client.id}
                    onSelect={() => handleSelectClient(client)}
                    className="flex items-center justify-between"
                  >
                    <span>{client.name}</span>
                    {selectedClients.some((c) => c.id === client.id) && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedClients.map((client) => (
          <Badge key={client.id} variant="secondary" className="flex items-center gap-1">
            {client.name}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={() => removeClient(client.id)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {client.name}</span>
            </Button>
          </Badge>
        ))}
      </div>
    </div>
    <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" value={currentJob.location.city} onChange={handleLocationChange} required />
            </div>
            <div>
              <Label htmlFor="zip">Zip Code</Label>
              <Input id="zip" name="zip" value={currentJob.location.zip} onChange={handleLocationChange} required />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" value={currentJob.location.state} onChange={handleLocationChange} required />
            </div>
            {/* <div>
              <Label htmlFor="otherinfo">Other Info (optional)</Label>
              <Input id="otherinfo" name="otherinfo" value={currentJob.location.otherInfo} onChange={handleLocationChange} />
            </div> */}
          </div>
         

        )
      case 'schedule':
        return (
         
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
    {/* Start Date */}
    <div>
      <Label>Start Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !currentJob.jobSchedule.startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentJob.jobSchedule.startDate ? format(currentJob.jobSchedule.startDate, "PPP") : <span>Pick a start date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={currentJob.jobSchedule.startDate as Date}
            onSelect={(date) => handleDateChange(date, 'startDate')}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>

    {/* End Date */}
    <div>
      <Label>End Date</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !currentJob.jobSchedule.endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {currentJob.jobSchedule.endDate ? format(currentJob.jobSchedule.endDate, "PPP") : <span>Pick an end date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={currentJob.jobSchedule.endDate as Date}
            onSelect={(date) => handleDateChange(date, 'endDate')}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  </div>
            <div>
              <Label htmlFor="recurrence">Recurrence</Label>
              <Select value={currentJob.jobSchedule.recurrence} onValueChange={(value) => handleSelectChange(value, 'jobSchedule.recurrence' as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recurrence" />
                </SelectTrigger>
                <SelectContent>
                  {recurrenceOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )
      case 'assign':
        return (
          <div className="space-y-4">
    <div>
      <Label htmlFor="technicians">Assign Technician</Label>
      <Popover open={openTechnicianSearch} onOpenChange={setOpenTechnicianSearch}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={openTechnicianSearch}
            className="w-full justify-between"
          >
            {selectedTechnicians.length > 0 ? `${selectedTechnicians.length} selected` : "Select technicians..."}
            <User className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search technicians..." onValueChange={setTechnicianSearch} />
            <CommandList>
              <CommandEmpty>No technician found.</CommandEmpty>
              <CommandGroup>
                {employee
                  .filter((tech:{id: string; name: string}) =>
                    tech.name.toLowerCase().includes(technicianSearch.toLowerCase())
                  )
                  .map((tech: { id: string; name: string }) => (
                    <CommandItem
                      key={tech.id}
                      onSelect={() => handleSelectTechnician(tech)}
                      className="flex items-center justify-between"
                    >
                      <span>{tech.name}</span>
                      {selectedTechnicians.some((t) => t.id === tech.id) && <Check className="h-4 w-4" />}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="mt-2 flex flex-wrap gap-2">
        {selectedTechnicians.map((tech) => (
          <Badge key={tech.id} variant="secondary" className="flex items-center gap-1">
            {tech.name}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={() => handleSelectTechnician(tech)}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Remove {tech.name}</span>
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  </div>
        )
      case 'review':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Job Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Job Name</p>
                  <p>{currentJob.name}</p>
                </div>
                <div>
                  <p className="font-semibold">Job Type</p>
                  <p>{currentJob.type}</p>
                </div>
                <div>
                  <p className="font-semibold">Client</p>
                  <p>{currentJob.clientId}</p>
                </div>
                <div>
                  <p className="font-semibold">Technician</p>
                  <p>{currentJob.technicianId}</p>
                </div>
                <div>
                  <p className="font-semibold">Start Date</p>
                  <p>{currentJob.jobSchedule.startDate ? format(currentJob.jobSchedule.startDate, 'PPP') : 'Not set'}</p>
                </div>
                <div>
                  <p className="font-semibold">End Date</p>
                  <p>{currentJob.jobSchedule.endDate ? format(currentJob.jobSchedule.endDate, 'PPP') : 'Not set'}</p>
                </div>
                <div>
                  <p className="font-semibold">Recurrence</p>
                  <p>{currentJob.jobSchedule.recurrence}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="font-semibold">Description</p>
                <p>{currentJob.description}</p>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  const renderProgressTracker = () => {
    const steps: Step[] = ['create', 'schedule', 'assign', 'review']
    return (
      <div className="flex justify-between mb-8">
        {steps.map((s, index) => (
          <div key={s} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${steps.indexOf(step) >= index ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
            >
              {index + 1}
            </div>
            <span className="text-sm mt-1 capitalize">{s}</span>
          </div>
        ))}
      </div>
    )
  }

  const renderJobList = () => (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            {/* <CardTitle className="flex justify-between items-center">
              <span>{job.name}</span>
              <Badge variant={job.status === 'Completed' ? 'default' : 'secondary'}>{job.status}</Badge>
            </CardTitle> */}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-semibold">Client</p>
                <p>{job.clientId}</p>
              </div>
              <div>
                <p className="font-semibold">Technician</p>
                <p>{job.technicianId}</p>
              </div>
              <div>
                <p className="font-semibold">Start Date</p>
                <p>{job.jobSchedule.startDate ? format(job.jobSchedule.startDate, 'PPP') : 'Not set'}</p>
              </div>
              <div>
                <p className="font-semibold">Job Type</p>
                <p>{job.type}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">View Details</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{job.name}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Client</Label>
                    <span className="col-span-3">{job.clientId}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Type</Label>
                    <span className="col-span-3">{job.type}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Technician</Label>
                    <span className="col-span-3">{job.technicianId}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Start Date</Label>
                    <span className="col-span-3">{job.jobSchedule.startDate ? format(job.jobSchedule.startDate, 'PPP') : 'Not set'}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">End Date</Label>
                    <span className="col-span-3">{job.jobSchedule.endDate ? format(job.jobSchedule.endDate, 'PPP') : 'Not set'}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Recurrence</Label>
                    <span className="col-span-3">{job.jobSchedule.recurrence}</span>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Description</Label>
                    <span className="col-span-3">{job.description}</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={() => handleEditJob(job)}>Edit</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Job</TabsTrigger>
          <TabsTrigger value="track">Track Jobs</TabsTrigger>
        </TabsList>
        <TabsContent value="create">
          <h1 className="text-2xl font-bold mb-4">{editingJobId ? 'Edit Job' : 'Create New Job'}</h1>
          {renderProgressTracker()}
          {renderStep()}
          <div className="flex justify-between mt-6">
            {step !== 'create' && (
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {!editingJobId && (
              <Button onClick={handleSaveDraft} variant="outline">
                <Save className="mr-2 h-4 w-4" /> Save Draft
              </Button>
            )}
            {step !== 'review' ? (
              <Button onClick={handleNext} className="ml-auto">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="ml-auto">
                {editingJobId ? 'Update Job' : 'Create Job'} <CheckCircle2 className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </TabsContent>
        <TabsContent value="track">
          <h1 className="text-2xl font-bold mb-4">Job Tracking</h1>
          {renderJobList()}
        </TabsContent>
      </Tabs>
    </div>
  )
}