-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL DEFAULT 'User',
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "jobId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "customer" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "die" TEXT NOT NULL,
    "colours" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "windingDirection" TEXT NOT NULL,
    "finishing" TEXT NOT NULL,
    "designerId" INTEGER NOT NULL,
    "clientRelationsId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Design Pending',
    "lastUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorOption" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ColorOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialOption" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "MaterialOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinishingOption" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FinishingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WindingOption" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "WindingOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobId_key" ON "Job"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "ColorOption_name_key" ON "ColorOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialOption_name_key" ON "MaterialOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FinishingOption_name_key" ON "FinishingOption"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WindingOption_name_key" ON "WindingOption"("name");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_clientRelationsId_fkey" FOREIGN KEY ("clientRelationsId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
