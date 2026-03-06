import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
  RefreshControl, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../../services/firebase/config';

const COLORS = {
  primary:'#4F46E5', primaryLight:'#EEF2FF',
  secondary:'#06B6D4', secondaryLight:'#ECFEFF',
  success:'#10B981', successLight:'#D1FAE5',
  danger:'#EF4444', dangerLight:'#FEF2F2',
  warning:'#F59E0B', warningLight:'#FEF3C7',
  purple:'#8B5CF6', purpleLight:'#F5F3FF',
  background:'#F8F9FE', card:'#FFFFFF',
  text:'#1E1B4B', textSecondary:'#6B7280', textLight:'#9CA3AF',
  border:'#E5E7EB', inputBg:'#F3F4F6', shadow:'#1E1B4B',
  overlay:'rgba(30,27,75,0.55)',
};

const CLASS_COLORS = ['#4F46E5','#06B6D4','#10B981','#F59E0B','#8B5CF6','#EC4899','#EF4444','#14B8A6'];
const getClassColor = (id='') => CLASS_COLORS[id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % CLASS_COLORS.length];
const getInitials = (name='') => { const w=name.trim().split(/[\s\-]+/); return w.length>=2?`${w[0][0]}${w[1][0]}`.toUpperCase():name.substring(0,2).toUpperCase()||'CL'; };
const formatDate = (ts) => { if(!ts) return ''; try { const d=ts.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}); } catch{return '';} };

const SCREEN_TABS   = [{key:'classes',label:'Classes',icon:'🏫'},{key:'subjects',label:'Subjects',icon:'📚'}];
const CLASS_FILTERS = [{key:'all',label:'All',icon:'🏫'},{key:'assigned',label:'Assigned',icon:'✅'},{key:'unassigned',label:'Unassigned',icon:'⚠️'}];

// ─── Generic Picker Item ──────────────────────────────────────────────────────
const PickerItem = ({item,selected,onPress,icon,multiSelect}) => (
  <TouchableOpacity style={[pS.item,selected&&pS.itemSel]} onPress={()=>onPress(item)} activeOpacity={0.75}>
    <View style={[pS.av,{backgroundColor:selected?COLORS.primary:COLORS.inputBg}]}><Text style={pS.avIcon}>{icon}</Text></View>
    <View style={pS.info}>
      <Text style={[pS.name,selected&&pS.nameSel]} numberOfLines={1}>{item.name}</Text>
      {!!item.email&&<Text style={pS.sub} numberOfLines={1}>{item.email}</Text>}
      {!!item.sub&&<Text style={pS.sub} numberOfLines={1}>{item.sub}</Text>}
    </View>
    {multiSelect
      ? <View style={[pS.cb,selected&&pS.cbOn]}>{selected&&<Text style={pS.cbTick}>✓</Text>}</View>
      : selected&&<Text style={pS.ck}>✓</Text>}
  </TouchableOpacity>
);
const pS = StyleSheet.create({
  item:{flexDirection:'row',alignItems:'center',padding:12,borderRadius:14,marginBottom:8,backgroundColor:COLORS.inputBg,borderWidth:1.5,borderColor:'transparent'},
  itemSel:{backgroundColor:COLORS.primaryLight,borderColor:COLORS.primary},
  av:{width:38,height:38,borderRadius:11,alignItems:'center',justifyContent:'center',marginRight:12},
  avIcon:{fontSize:18},
  info:{flex:1},
  name:{fontSize:14,fontWeight:'600',color:COLORS.text},
  nameSel:{color:COLORS.primary},
  sub:{fontSize:12,color:COLORS.textSecondary,marginTop:1},
  cb:{width:22,height:22,borderRadius:7,borderWidth:2,borderColor:COLORS.border,alignItems:'center',justifyContent:'center'},
  cbOn:{backgroundColor:COLORS.secondary,borderColor:COLORS.secondary},
  cbTick:{color:'#fff',fontSize:12,fontWeight:'800'},
  ck:{fontSize:16,color:COLORS.primary,fontWeight:'700'},
});

// ─── Step Indicator ───────────────────────────────────────────────────────────
const Steps = ({active}) => (
  <View style={mS.stepRow}>
    {['🏫 Class','📚 Subject','🔗 Assign'].map((s,i)=>(
      <View key={i} style={mS.stepItem}>
        <View style={[mS.stepDot,i<=active&&mS.stepDotActive,i<active&&mS.stepDotDone]}>
          <Text style={mS.stepNum}>{i<active?'✓':i+1}</Text>
        </View>
        <Text style={[mS.stepLbl,i<=active&&mS.stepLblActive]}>{s}</Text>
        {i<2&&<View style={[mS.stepLine,i<active&&mS.stepLineDone]}/>}
      </View>
    ))}
  </View>
);

// ─── Modal shared styles ──────────────────────────────────────────────────────
const mS = StyleSheet.create({
  overlay:{flex:1,backgroundColor:COLORS.overlay,justifyContent:'flex-end'},
  kv:{justifyContent:'flex-end'},
  sheet:{backgroundColor:COLORS.card,borderTopLeftRadius:28,borderTopRightRadius:28,paddingHorizontal:20,paddingTop:12,maxHeight:'93%'},
  handle:{width:40,height:4,backgroundColor:COLORS.border,borderRadius:2,alignSelf:'center',marginBottom:16},
  hdrRow:{flexDirection:'row',alignItems:'center',marginBottom:14,gap:12},
  hdrIcon:{width:44,height:44,borderRadius:14,backgroundColor:COLORS.primaryLight,alignItems:'center',justifyContent:'center'},
  hdrIconTxt:{fontSize:22},
  title:{fontSize:19,fontWeight:'800',color:COLORS.text,letterSpacing:-0.3},
  subtitle:{fontSize:12,color:COLORS.textSecondary,marginTop:1},
  closeBtn:{width:32,height:32,borderRadius:10,backgroundColor:COLORS.inputBg,alignItems:'center',justifyContent:'center'},
  closeTxt:{fontSize:13,color:COLORS.textSecondary,fontWeight:'700'},
  stepRow:{flexDirection:'row',alignItems:'center',marginBottom:20},
  stepItem:{flexDirection:'row',alignItems:'center',flex:1},
  stepDot:{width:24,height:24,borderRadius:12,backgroundColor:COLORS.border,alignItems:'center',justifyContent:'center'},
  stepDotActive:{backgroundColor:COLORS.primary},
  stepDotDone:{backgroundColor:COLORS.success},
  stepNum:{color:'#fff',fontSize:11,fontWeight:'800'},
  stepLine:{flex:1,height:2,backgroundColor:COLORS.border,marginHorizontal:4},
  stepLineDone:{backgroundColor:COLORS.success},
  stepLbl:{fontSize:9,color:COLORS.textLight,fontWeight:'500',position:'absolute',top:26,left:0,width:60},
  stepLblActive:{color:COLORS.primary},
  innerTabRow:{flexDirection:'row',gap:10,marginBottom:14},
  innerTab:{flex:1,paddingVertical:10,borderRadius:12,alignItems:'center',backgroundColor:COLORS.inputBg,borderWidth:1.5,borderColor:COLORS.border},
  innerTabOn:{backgroundColor:COLORS.primaryLight,borderColor:COLORS.primary},
  innerTabTxt:{fontSize:13,fontWeight:'600',color:COLORS.textSecondary},
  innerTabTxtOn:{color:COLORS.primary},
  fGroup:{marginBottom:16},
  lbl:{fontSize:14,fontWeight:'600',color:COLORS.text,marginBottom:8},
  req:{color:COLORS.danger},
  opt:{color:COLORS.textLight,fontWeight:'400',fontSize:12},
  inRow:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.inputBg,borderRadius:14,paddingHorizontal:14,borderWidth:1.5,borderColor:COLORS.border},
  inIcon:{fontSize:15,marginRight:10},
  input:{flex:1,fontSize:15,color:COLORS.text,paddingVertical:13},
  searchBox:{backgroundColor:COLORS.inputBg,borderRadius:12,paddingHorizontal:14,paddingVertical:10,fontSize:14,color:COLORS.text,marginBottom:10,borderWidth:1,borderColor:COLORS.border},
  emptyP:{textAlign:'center',color:COLORS.textLight,fontSize:14,paddingVertical:16},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},
  chip:{backgroundColor:COLORS.secondaryLight,borderRadius:20,paddingHorizontal:12,paddingVertical:5},
  chipTxt:{fontSize:12,color:COLORS.secondary,fontWeight:'600'},
  purpleChip:{backgroundColor:COLORS.purpleLight},
  purpleChipTxt:{color:COLORS.purple},
  preview:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.purpleLight,borderRadius:14,padding:14,marginBottom:16,gap:12,borderWidth:1.5,borderColor:'rgba(139,92,246,0.25)'},
  previewIcon:{fontSize:28},
  previewTitle:{fontSize:15,fontWeight:'700',color:COLORS.text},
  previewSub:{fontSize:13,color:COLORS.textSecondary,marginTop:2},
  summary:{backgroundColor:COLORS.inputBg,borderRadius:14,padding:14,marginBottom:18,borderWidth:1,borderColor:COLORS.border},
  summaryTitle:{fontSize:13,fontWeight:'700',color:COLORS.text,marginBottom:10},
  summaryRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6},
  summaryIcon:{fontSize:14},
  summaryTxt:{fontSize:13,color:COLORS.text,fontWeight:'600',flex:1},
  summaryTeacher:{fontSize:12,color:COLORS.textSecondary},
  summaryDiv:{height:1,backgroundColor:COLORS.border,marginVertical:8},
  saveBtn:{borderRadius:16,paddingVertical:15,alignItems:'center',marginTop:8,shadowOffset:{width:0,height:4},shadowOpacity:0.28,shadowRadius:10,elevation:6},
  saveBtnOff:{opacity:0.65},
  saveBtnTxt:{color:'#fff',fontSize:16,fontWeight:'700',letterSpacing:0.3},
  // Action sheet
  aSheet:{backgroundColor:COLORS.card,borderTopLeftRadius:28,borderTopRightRadius:28,paddingHorizontal:20,paddingTop:14},
  aTitle:{fontSize:18,fontWeight:'800',color:COLORS.text,marginBottom:4},
  aSub:{fontSize:13,color:COLORS.textSecondary,marginBottom:20},
  aItem:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.inputBg,borderRadius:16,padding:14,marginBottom:12,borderLeftWidth:4,gap:12},
  aItemIcon:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},
  aItemIconTxt:{fontSize:22},
  aItemLbl:{fontSize:15,fontWeight:'700'},
  aItemSub:{fontSize:12,color:COLORS.textSecondary,marginTop:2},
  aItemArrow:{fontSize:22,fontWeight:'300'},
});

// ─── ACTION SHEET ─────────────────────────────────────────────────────────────
const ActionSheet = ({visible,onClose,onSelect}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <TouchableOpacity style={mS.overlay} activeOpacity={1} onPress={onClose}>
      <View style={mS.aSheet}>
        <View style={mS.handle}/>
        <Text style={mS.aTitle}>What would you like to do?</Text>
        <Text style={mS.aSub}>Choose an action to perform</Text>
        {[
          {key:'class',  icon:'🏫',label:'Create New Class',   sub:'Add a class and enroll students',      color:COLORS.primary, bg:COLORS.primaryLight},
          {key:'subject',icon:'📚',label:'Create New Subject', sub:'Add a subject and assign a teacher',   color:COLORS.purple,  bg:COLORS.purpleLight},
          {key:'assign', icon:'🔗',label:'Assign Subject to Class',sub:'Link subjects to an existing class',color:COLORS.success,bg:COLORS.successLight},
        ].map((a)=>(
          <TouchableOpacity key={a.key} style={[mS.aItem,{borderLeftColor:a.color}]}
            onPress={()=>{onClose(); setTimeout(()=>onSelect(a.key),300);}} activeOpacity={0.8}>
            <View style={[mS.aItemIcon,{backgroundColor:a.bg}]}><Text style={mS.aItemIconTxt}>{a.icon}</Text></View>
            <View style={{flex:1}}>
              <Text style={[mS.aItemLbl,{color:a.color}]}>{a.label}</Text>
              <Text style={mS.aItemSub}>{a.sub}</Text>
            </View>
            <Text style={[mS.aItemArrow,{color:a.color}]}>›</Text>
          </TouchableOpacity>
        ))}
        <View style={{height:24}}/>
      </View>
    </TouchableOpacity>
  </Modal>
);

// ─── CREATE CLASS MODAL ───────────────────────────────────────────────────────
const CreateClassModal = ({visible,onClose,onSave,students}) => {
  const [name,setSel]=useState('');
  const [selStudents,setSelStudents]=useState([]);
  const [search,setSearch]=useState('');
  const [saving,setSaving]=useState(false);
  const reset=()=>{setSel('');setSelStudents([]);setSearch('');setSaving(false);};
  const handleClose=()=>{reset();onClose();};
  const toggle=(s)=>setSelStudents(p=>p.find(x=>x.id===s.id)?p.filter(x=>x.id!==s.id):[...p,s]);
  const handleSave=async()=>{
    if(!name.trim()){Alert.alert('Required','Please enter a class name.');return;}
    setSaving(true);
    await onSave({name:name.trim(),students:selStudents.map(s=>s.id)});
    reset();
  };
  const filtered=students.filter(s=>(s.name||'').toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={mS.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={mS.kv}>
          <View style={mS.sheet}>
            <View style={mS.handle}/>
            <View style={mS.hdrRow}>
              <View style={mS.hdrIcon}><Text style={mS.hdrIconTxt}>🏫</Text></View>
              <View style={{flex:1}}>
                <Text style={mS.title}>Create New Class</Text>
                <Text style={mS.subtitle}>Step 1 of 3 — Class details</Text>
              </View>
              <TouchableOpacity style={mS.closeBtn} onPress={handleClose}><Text style={mS.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            <Steps active={0}/>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={mS.fGroup}>
                <Text style={mS.lbl}>Class Name <Text style={mS.req}>*</Text></Text>
                <View style={mS.inRow}>
                  <Text style={mS.inIcon}>🏫</Text>
                  <TextInput style={mS.input} placeholder="e.g. Grade 10 - A" placeholderTextColor={COLORS.textLight}
                    value={name} onChangeText={setSel} autoCapitalize="words"/>
                </View>
              </View>
              <Text style={mS.lbl}>Enroll Students <Text style={mS.opt}>(optional)</Text></Text>
              <TextInput style={mS.searchBox} placeholder="Search student..." placeholderTextColor={COLORS.textLight}
                value={search} onChangeText={setSearch}/>
              {selStudents.length>0&&(
                <View style={mS.chips}>
                  {selStudents.map(s=>(
                    <TouchableOpacity key={s.id} style={mS.chip} onPress={()=>toggle(s)}>
                      <Text style={mS.chipTxt}>{s.name}  ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {filtered.map(s=>(
                <PickerItem key={s.id} item={s} icon="🎓"
                  selected={!!selStudents.find(x=>x.id===s.id)} onPress={toggle} multiSelect/>
              ))}
              {filtered.length===0&&<Text style={mS.emptyP}>No students found</Text>}
              <TouchableOpacity style={[mS.saveBtn,{backgroundColor:COLORS.primary,shadowColor:COLORS.primary},saving&&mS.saveBtnOff]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={mS.saveBtnTxt}>Create Class  →</Text>}
              </TouchableOpacity>
              <View style={{height:32}}/>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── CREATE SUBJECT MODAL ─────────────────────────────────────────────────────
const CreateSubjectModal = ({visible,onClose,onSave,teachers}) => {
  const [subName,setSubName]=useState('');
  const [selTeacher,setSelTeacher]=useState(null);
  const [search,setSearch]=useState('');
  const [saving,setSaving]=useState(false);
  const reset=()=>{setSubName('');setSelTeacher(null);setSearch('');setSaving(false);};
  const handleClose=()=>{reset();onClose();};
  const handleSave=async()=>{
    if(!subName.trim()){Alert.alert('Required','Please enter a subject name.');return;}
    if(!selTeacher){Alert.alert('Required','Please assign a teacher.');return;}
    setSaving(true);
    await onSave({name:subName.trim(),teacherId:selTeacher.id,teacherName:selTeacher.name});
    reset();
  };
  const filtered=teachers.filter(t=>(t.name||'').toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={mS.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={mS.kv}>
          <View style={mS.sheet}>
            <View style={mS.handle}/>
            <View style={mS.hdrRow}>
              <View style={[mS.hdrIcon,{backgroundColor:COLORS.purpleLight}]}><Text style={mS.hdrIconTxt}>📚</Text></View>
              <View style={{flex:1}}>
                <Text style={mS.title}>Create Subject</Text>
                <Text style={mS.subtitle}>Step 2 of 3 — Assign teacher</Text>
              </View>
              <TouchableOpacity style={mS.closeBtn} onPress={handleClose}><Text style={mS.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            <Steps active={1}/>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={mS.fGroup}>
                <Text style={mS.lbl}>Subject Name <Text style={mS.req}>*</Text></Text>
                <View style={mS.inRow}>
                  <Text style={mS.inIcon}>📚</Text>
                  <TextInput style={mS.input} placeholder="e.g. Mathematics, Physics" placeholderTextColor={COLORS.textLight}
                    value={subName} onChangeText={setSubName} autoCapitalize="words"/>
                </View>
              </View>
              <Text style={mS.lbl}>Assign Teacher <Text style={mS.req}>*</Text></Text>
              <TextInput style={mS.searchBox} placeholder="Search teacher..." placeholderTextColor={COLORS.textLight}
                value={search} onChangeText={setSearch}/>
              <TouchableOpacity style={[pS.item,!selTeacher&&pS.itemSel]} onPress={()=>setSelTeacher(null)} activeOpacity={0.75}>
                <View style={[pS.av,{backgroundColor:!selTeacher?COLORS.danger:COLORS.inputBg}]}><Text style={pS.avIcon}>🚫</Text></View>
                <View style={pS.info}><Text style={[pS.name,!selTeacher&&{color:COLORS.danger}]}>No Teacher</Text></View>
                {!selTeacher&&<Text style={pS.ck}>✓</Text>}
              </TouchableOpacity>
              {filtered.map(t=>(
                <PickerItem key={t.id} item={t} icon="👩‍🏫"
                  selected={selTeacher?.id===t.id} onPress={setSelTeacher} multiSelect={false}/>
              ))}
              {filtered.length===0&&<Text style={mS.emptyP}>No teachers found</Text>}
              {subName.trim()!==''&&selTeacher&&(
                <View style={mS.preview}>
                  <Text style={mS.previewIcon}>📚</Text>
                  <View>
                    <Text style={mS.previewTitle}>{subName}</Text>
                    <Text style={mS.previewSub}>👩‍🏫 {selTeacher.name}</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity style={[mS.saveBtn,{backgroundColor:COLORS.purple,shadowColor:COLORS.purple},saving&&mS.saveBtnOff]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={mS.saveBtnTxt}>Create Subject  →</Text>}
              </TouchableOpacity>
              <View style={{height:32}}/>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── ASSIGN SUBJECT → CLASS MODAL ────────────────────────────────────────────
const AssignSubjectModal = ({visible,onClose,onSave,classes,subjects}) => {
  const [selClass,setSelClass]=useState(null);
  const [selSubjects,setSelSubjects]=useState([]);
  const [classSearch,setClassSearch]=useState('');
  const [subSearch,setSubSearch]=useState('');
  const [innerTab,setInnerTab]=useState('class');
  const [saving,setSaving]=useState(false);
  const reset=()=>{setSelClass(null);setSelSubjects([]);setClassSearch('');setSubSearch('');setInnerTab('class');setSaving(false);};
  const handleClose=()=>{reset();onClose();};
  const toggleSub=(s)=>setSelSubjects(p=>p.find(x=>x.id===s.id)?p.filter(x=>x.id!==s.id):[...p,s]);
  const handleSave=async()=>{
    if(!selClass){Alert.alert('Required','Please select a class.');return;}
    if(selSubjects.length===0){Alert.alert('Required','Please select at least one subject.');return;}
    setSaving(true);
    await onSave({classId:selClass.id,className:selClass.name,subjects:selSubjects});
    reset();
  };
  const filteredC=classes.filter(c=>(c.name||'').toLowerCase().includes(classSearch.toLowerCase()));
  const filteredS=subjects.filter(s=>(s.name||'').toLowerCase().includes(subSearch.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={mS.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={mS.kv}>
          <View style={mS.sheet}>
            <View style={mS.handle}/>
            <View style={mS.hdrRow}>
              <View style={[mS.hdrIcon,{backgroundColor:COLORS.successLight}]}><Text style={mS.hdrIconTxt}>🔗</Text></View>
              <View style={{flex:1}}>
                <Text style={mS.title}>Assign Subject to Class</Text>
                <Text style={mS.subtitle}>Step 3 of 3 — Link subjects</Text>
              </View>
              <TouchableOpacity style={mS.closeBtn} onPress={handleClose}><Text style={mS.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            <Steps active={2}/>
            <View style={mS.innerTabRow}>
              {[{key:'class',label:`🏫 Class${selClass?' ✓':''}`},{key:'subjects',label:`📚 Subjects (${selSubjects.length})`}].map(t=>(
                <TouchableOpacity key={t.key}
                  style={[mS.innerTab,innerTab===t.key&&mS.innerTabOn]}
                  onPress={()=>setInnerTab(t.key)}>
                  <Text style={[mS.innerTabTxt,innerTab===t.key&&mS.innerTabTxtOn]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {innerTab==='class'?(
                <>
                  <TextInput style={mS.searchBox} placeholder="Search class..." placeholderTextColor={COLORS.textLight}
                    value={classSearch} onChangeText={setClassSearch}/>
                  {filteredC.map(c=>(
                    <PickerItem key={c.id} item={{...c,sub:`🎓 ${c.students?.length??0} students`}} icon="🏫"
                      selected={selClass?.id===c.id} onPress={setSelClass} multiSelect={false}/>
                  ))}
                  {filteredC.length===0&&<Text style={mS.emptyP}>No classes found</Text>}
                </>
              ):(
                <>
                  <TextInput style={mS.searchBox} placeholder="Search subject..." placeholderTextColor={COLORS.textLight}
                    value={subSearch} onChangeText={setSubSearch}/>
                  {selSubjects.length>0&&(
                    <View style={mS.chips}>
                      {selSubjects.map(s=>(
                        <TouchableOpacity key={s.id} style={[mS.chip,mS.purpleChip]} onPress={()=>toggleSub(s)}>
                          <Text style={[mS.chipTxt,mS.purpleChipTxt]}>{s.name}  ✕</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {filteredS.map(s=>(
                    <PickerItem key={s.id} item={{...s,sub:`👩‍🏫 ${s.teacherName||'No teacher'}`}} icon="📚"
                      selected={!!selSubjects.find(x=>x.id===s.id)} onPress={toggleSub} multiSelect/>
                  ))}
                  {filteredS.length===0&&<Text style={mS.emptyP}>No subjects found</Text>}
                </>
              )}
              {selClass&&selSubjects.length>0&&(
                <View style={mS.summary}>
                  <Text style={mS.summaryTitle}>📋 Assignment Summary</Text>
                  <View style={mS.summaryRow}><Text style={mS.summaryIcon}>🏫</Text><Text style={mS.summaryTxt}>{selClass.name}</Text></View>
                  <View style={mS.summaryDiv}/>
                  {selSubjects.map(s=>(
                    <View key={s.id} style={mS.summaryRow}>
                      <Text style={mS.summaryIcon}>📚</Text>
                      <Text style={mS.summaryTxt}>{s.name}</Text>
                      <Text style={mS.summaryTeacher}>👩‍🏫 {s.teacherName||'—'}</Text>
                    </View>
                  ))}
                </View>
              )}
              <TouchableOpacity style={[mS.saveBtn,{backgroundColor:COLORS.success,shadowColor:COLORS.success},saving&&mS.saveBtnOff]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={mS.saveBtnTxt}>✓  Assign Subjects</Text>}
              </TouchableOpacity>
              <View style={{height:32}}/>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── CLASS CARD ───────────────────────────────────────────────────────────────
const ClassCard = ({cls,subjectCount,onDelete,onView}) => {
  const color=getClassColor(cls.id);
  const students=cls.students?.length??0;
  return (
    <View style={s.classCard}>
      <View style={[s.stripe,{backgroundColor:color}]}/>
      <View style={s.cardBody}>
        <View style={s.cardLeft}>
          <View style={[s.av,{backgroundColor:color}]}><Text style={s.avTxt}>{getInitials(cls.name)}</Text></View>
          <View style={s.info}>
            <Text style={s.clsName} numberOfLines={1}>{cls.name}</Text>
            <View style={s.infoRow}><Text style={s.infoIcon}>🎓</Text><Text style={s.infoTxt}>{students} {students===1?'Student':'Students'}</Text></View>
            <View style={s.infoRow}>
              <Text style={s.infoIcon}>📚</Text>
              <Text style={s.infoTxt}>{subjectCount} {subjectCount===1?'Subject':'Subjects'}</Text>
              {subjectCount===0&&<View style={s.wBadge}><Text style={s.wBadgeTxt}>No Subjects</Text></View>}
            </View>
            {!!formatDate(cls.createdAt)&&<View style={s.infoRow}><Text style={s.infoIcon}>📅</Text><Text style={[s.infoTxt,{color:COLORS.textLight}]}>{formatDate(cls.createdAt)}</Text></View>}
          </View>
        </View>
        <View style={s.actions}>
          <TouchableOpacity style={[s.actBtn,{backgroundColor:COLORS.primaryLight}]} onPress={()=>onView(cls)} activeOpacity={0.7}><Text style={s.actIcon}>👁️</Text></TouchableOpacity>
          <TouchableOpacity style={[s.actBtn,{backgroundColor:COLORS.dangerLight}]}
            onPress={()=>Alert.alert('Delete Class',`Delete "${cls.name}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>onDelete(cls.id)}])}
            activeOpacity={0.7}><Text style={s.actIcon}>🗑️</Text></TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ─── SUBJECT CARD ─────────────────────────────────────────────────────────────
const SubjectCard = ({subject,classCount,onDelete}) => (
  <View style={s.subCard}>
    <View style={[s.subIconBox,{backgroundColor:COLORS.purpleLight}]}><Text style={s.subIcon}>📚</Text></View>
    <View style={s.subInfo}>
      <Text style={s.subName} numberOfLines={1}>{subject.name}</Text>
      <View style={s.infoRow}><Text style={s.infoIcon}>👩‍🏫</Text><Text style={[s.infoTxt,!subject.teacherName&&{color:COLORS.warning}]}>{subject.teacherName||'No Teacher Assigned'}</Text></View>
      <View style={s.infoRow}><Text style={s.infoIcon}>🏫</Text><Text style={s.infoTxt}>{classCount} {classCount===1?'Class':'Classes'}</Text></View>
    </View>
    <TouchableOpacity style={[s.actBtn,{backgroundColor:COLORS.dangerLight}]}
      onPress={()=>Alert.alert('Delete Subject',`Delete "${subject.name}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>onDelete(subject.id)}])}
      activeOpacity={0.7}><Text style={s.actIcon}>🗑️</Text></TouchableOpacity>
  </View>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const ClassesScreen = ({navigation}) => {
  const [classes,setClasses]=useState([]);
  const [subjects,setSubjects]=useState([]);
  const [classSubjects,setClassSubjects]=useState([]);
  const [teachers,setTeachers]=useState([]);
  const [students,setStudents]=useState([]);
  const [screenTab,setScreenTab]=useState('classes');
  const [classFilter,setClassFilter]=useState('all');
  const [searchQuery,setSearchQuery]=useState('');
  const [filteredClasses,setFilteredClasses]=useState([]);
  const [filteredSubjects,setFilteredSubjects]=useState([]);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [actionSheet,setActionSheet]=useState(false);
  const [classModal,setClassModal]=useState(false);
  const [subjectModal,setSubjectModal]=useState(false);
  const [assignModal,setAssignModal]=useState(false);

  const fetchAll=async()=>{
    try {
      const [clSnap,subSnap,csSnap,uSnap]=await Promise.all([
        getDocs(query(collection(db,'classes'),orderBy('createdAt','desc'))),
        getDocs(query(collection(db,'subjects'),orderBy('createdAt','desc'))),
        getDocs(collection(db,'class_subjects')),
        getDocs(collection(db,'users')),
      ]);
      const allU=uSnap.docs.map(d=>({id:d.id,...d.data()}));
      setClasses(clSnap.docs.map(d=>({id:d.id,...d.data()})));
      setSubjects(subSnap.docs.map(d=>({id:d.id,...d.data()})));
      setClassSubjects(csSnap.docs.map(d=>({id:d.id,...d.data()})));
      setTeachers(allU.filter(u=>u.role==='teacher'));
      setStudents(allU.filter(u=>u.role==='student'));
    } catch(e){console.error('fetch',e);}
    finally{setLoading(false);setRefreshing(false);}
  };

  useEffect(()=>{fetchAll();},[]);
  const onRefresh=useCallback(()=>{setRefreshing(true);fetchAll();},[]);

  useEffect(()=>{
    let r=[...classes];
    const q=searchQuery.toLowerCase().trim();
    if(classFilter==='assigned')   r=r.filter(c=>classSubjects.some(cs=>cs.classId===c.id));
    if(classFilter==='unassigned') r=r.filter(c=>!classSubjects.some(cs=>cs.classId===c.id));
    if(q) r=r.filter(c=>(c.name||'').toLowerCase().includes(q));
    setFilteredClasses(r);
  },[classes,classFilter,searchQuery,classSubjects]);

  useEffect(()=>{
    const q=searchQuery.toLowerCase().trim();
    setFilteredSubjects(q?subjects.filter(s=>(s.name||'').toLowerCase().includes(q)||(s.teacherName||'').toLowerCase().includes(q)):subjects);
  },[subjects,searchQuery]);

  const subjectCountForClass =(id)=>classSubjects.filter(cs=>cs.classId===id).length;
  const classCountForSubject =(id)=>classSubjects.filter(cs=>cs.subjectId===id).length;
  const getTabCount=(key)=>{
    if(key==='all') return classes.length;
    if(key==='assigned') return classes.filter(c=>classSubjects.some(cs=>cs.classId===c.id)).length;
    if(key==='unassigned') return classes.filter(c=>!classSubjects.some(cs=>cs.classId===c.id)).length;
    return 0;
  };

  const handleCreateClass=async({name,students:sIds})=>{
    try{
      const ref=await addDoc(collection(db,'classes'),{name,students:sIds,createdAt:serverTimestamp()});
      setClasses(p=>[{id:ref.id,name,students:sIds,createdAt:new Date()},...p]);
      setClassModal(false);
      Alert.alert('✅ Success',`Class "${name}" created!`);
    }catch{Alert.alert('Error','Failed to create class.');}
  };

  const handleCreateSubject=async({name,teacherId,teacherName})=>{
    try{
      const ref=await addDoc(collection(db,'subjects'),{name,teacherId,teacherName,createdAt:serverTimestamp()});
      setSubjects(p=>[{id:ref.id,name,teacherId,teacherName,createdAt:new Date()},...p]);
      setSubjectModal(false);
      Alert.alert('✅ Success',`Subject "${name}" assigned to ${teacherName}!`);
    }catch{Alert.alert('Error','Failed to create subject.');}
  };

  const handleAssignSubjects=async({classId,className,subjects:subs})=>{
    try{
      const batch=writeBatch(db);
      const newEntries=[];
      for(const sub of subs){
        const exists=classSubjects.find(cs=>cs.classId===classId&&cs.subjectId===sub.id);
        if(!exists){
          const ref=doc(collection(db,'class_subjects'));
          batch.set(ref,{classId,className,subjectId:sub.id,subjectName:sub.name,teacherId:sub.teacherId,teacherName:sub.teacherName,createdAt:serverTimestamp()});
          newEntries.push({id:ref.id,classId,subjectId:sub.id,subjectName:sub.name,teacherName:sub.teacherName});
        }
      }
      await batch.commit();
      setClassSubjects(p=>[...p,...newEntries]);
      setAssignModal(false);
      Alert.alert('✅ Success',`${subs.length} subject(s) assigned to ${className}!`);
    }catch{Alert.alert('Error','Failed to assign subjects.');}
  };

  const handleDeleteClass=async(id)=>{
    try{
      await deleteDoc(doc(db,'classes',id));
      setClasses(p=>p.filter(c=>c.id!==id));
      const rel=classSubjects.filter(cs=>cs.classId===id);
      await Promise.all(rel.map(cs=>deleteDoc(doc(db,'class_subjects',cs.id))));
      setClassSubjects(p=>p.filter(cs=>cs.classId!==id));
    }catch{Alert.alert('Error','Failed to delete class.');}
  };

  const handleDeleteSubject=async(id)=>{
    try{
      await deleteDoc(doc(db,'subjects',id));
      setSubjects(p=>p.filter(x=>x.id!==id));
      const rel=classSubjects.filter(cs=>cs.subjectId===id);
      await Promise.all(rel.map(cs=>deleteDoc(doc(db,'class_subjects',cs.id))));
      setClassSubjects(p=>p.filter(cs=>cs.subjectId!==id));
    }catch{Alert.alert('Error','Failed to delete subject.');}
  };

  const keyExtractor=item=>item.id;
  const renderClass=({item})=>(<ClassCard cls={item} subjectCount={subjectCountForClass(item.id)} onDelete={handleDeleteClass} onView={c=>navigation?.navigate('ClassDetail',{classData:c})}/>);
  const renderSubject=({item})=>(<SubjectCard subject={item} classCount={classCountForSubject(item.id)} onDelete={handleDeleteSubject}/>);

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary}/>

      {/* Header */}
      <View style={s.header}>
        <View style={s.hdrTop}>
          <View>
            <Text style={s.hdrTitle}>Class Management</Text>
            <Text style={s.hdrSub}>Classes · Subjects · Assignments</Text>
          </View>
          <TouchableOpacity style={s.hdrBtn} onPress={()=>setActionSheet(true)} activeOpacity={0.8}>
            <Text style={s.hdrBtnTxt}>+ New</Text>
          </TouchableOpacity>
        </View>
        <View style={s.statsStrip}>
          {[{num:classes.length,label:'Classes'},{num:subjects.length,label:'Subjects'},{num:classSubjects.length,label:'Links'},{num:teachers.length,label:'Teachers'}].map((x,i,arr)=>(
            <React.Fragment key={x.label}>
              <View style={s.statPill}><Text style={s.statNum}>{x.num}</Text><Text style={s.statLbl}>{x.label}</Text></View>
              {i<arr.length-1&&<View style={s.statDiv}/>}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Screen tabs */}
      <View style={s.screenTabRow}>
        {SCREEN_TABS.map(t=>(
          <TouchableOpacity key={t.key} style={[s.screenTab,screenTab===t.key&&s.screenTabOn]}
            onPress={()=>{setScreenTab(t.key);setSearchQuery('');}} activeOpacity={0.8}>
            <Text style={[s.screenTabTxt,screenTab===t.key&&s.screenTabTxtOn]}>{t.icon}  {t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.body}>
        {/* Search */}
        <View style={s.searchWrap}>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput style={s.searchInput}
              placeholder={screenTab==='classes'?'Search classes...':'Search subjects or teacher...'}
              placeholderTextColor={COLORS.textLight} value={searchQuery}
              onChangeText={setSearchQuery} autoCorrect={false} autoCapitalize="none"/>
            {searchQuery.length>0&&(
              <TouchableOpacity onPress={()=>setSearchQuery('')} hitSlop={{top:10,bottom:10,left:10,right:10}}>
                <Text style={s.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Class filter tabs */}
        {screenTab==='classes'&&(
          <View style={s.tabsRow}>
            {CLASS_FILTERS.map(tab=>{
              const isActive=classFilter===tab.key;
              return (
                <TouchableOpacity key={tab.key} style={[s.tab,isActive&&s.tabOn]}
                  onPress={()=>setClassFilter(tab.key)} activeOpacity={0.75}>
                  <Text style={[s.tabLbl,isActive&&s.tabLblOn]}>{tab.icon}  {tab.label}</Text>
                  <View style={[s.tabCnt,isActive&&s.tabCntOn]}>
                    <Text style={[s.tabCntTxt,isActive&&s.tabCntTxtOn]}>{getTabCount(tab.key)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Meta */}
        {!loading&&(
          <View style={s.meta}>
            <Text style={s.metaTxt}>
              {screenTab==='classes'?`${filteredClasses.length} ${filteredClasses.length===1?'class':'classes'} found`:`${filteredSubjects.length} ${filteredSubjects.length===1?'subject':'subjects'} found`}
            </Text>
          </View>
        )}

        {/* List */}
        {loading?(
          <View style={s.loader}><ActivityIndicator size="large" color={COLORS.primary}/><Text style={s.loaderTxt}>Loading...</Text></View>
        ):screenTab==='classes'?(
          <FlatList data={filteredClasses} keyExtractor={keyExtractor} renderItem={renderClass}
            contentContainerStyle={[s.list,filteredClasses.length===0&&s.listEmpty]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={s.emptyBox}><Text style={s.emptyEmoji}>🏫</Text><Text style={s.emptyTitle}>{searchQuery?'No results found':'No classes yet'}</Text><Text style={s.emptySub}>{searchQuery?'Try a different search':'Tap + New to create your first class'}</Text></View>}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary}/>}
            ItemSeparatorComponent={()=><View style={{height:12}}/>}
          />
        ):(
          <FlatList data={filteredSubjects} keyExtractor={keyExtractor} renderItem={renderSubject}
            contentContainerStyle={[s.list,filteredSubjects.length===0&&s.listEmpty]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<View style={s.emptyBox}><Text style={s.emptyEmoji}>📚</Text><Text style={s.emptyTitle}>{searchQuery?'No results found':'No subjects yet'}</Text><Text style={s.emptySub}>{searchQuery?'Try a different search':'Tap + New to create your first subject'}</Text></View>}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary}/>}
            ItemSeparatorComponent={()=><View style={{height:12}}/>}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={()=>setActionSheet(true)} activeOpacity={0.85}>
        <Text style={s.fabIcon}>＋</Text>
      </TouchableOpacity>

      {/* Modals */}
      <ActionSheet visible={actionSheet} onClose={()=>setActionSheet(false)}
        onSelect={(key)=>{if(key==='class')setClassModal(true);if(key==='subject')setSubjectModal(true);if(key==='assign')setAssignModal(true);}}/>
      <CreateClassModal visible={classModal} onClose={()=>setClassModal(false)} onSave={handleCreateClass} students={students}/>
      <CreateSubjectModal visible={subjectModal} onClose={()=>setSubjectModal(false)} onSave={handleCreateSubject} teachers={teachers}/>
      <AssignSubjectModal visible={assignModal} onClose={()=>setAssignModal(false)} onSave={handleAssignSubjects} classes={classes} subjects={subjects}/>
    </View>
  );
};

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:COLORS.background},
  header:{backgroundColor:COLORS.primary,paddingTop:52,paddingHorizontal:20,paddingBottom:20,borderBottomLeftRadius:28,borderBottomRightRadius:28},
  hdrTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
  hdrTitle:{fontSize:22,fontWeight:'800',color:'#fff',letterSpacing:-0.3},
  hdrSub:{fontSize:13,color:'rgba(255,255,255,0.70)',marginTop:2},
  hdrBtn:{backgroundColor:'rgba(255,255,255,0.22)',borderRadius:20,paddingVertical:8,paddingHorizontal:16,borderWidth:1.5,borderColor:'rgba(255,255,255,0.35)'},
  hdrBtnTxt:{color:'#fff',fontWeight:'700',fontSize:14},
  statsStrip:{flexDirection:'row',backgroundColor:'rgba(255,255,255,0.15)',borderRadius:14,paddingVertical:10,paddingHorizontal:12,alignItems:'center',justifyContent:'space-around'},
  statPill:{alignItems:'center',flex:1},
  statNum:{color:'#fff',fontSize:17,fontWeight:'800'},
  statLbl:{color:'rgba(255,255,255,0.70)',fontSize:11,fontWeight:'500',marginTop:1},
  statDiv:{width:1,height:26,backgroundColor:'rgba(255,255,255,0.25)'},
  screenTabRow:{flexDirection:'row',marginHorizontal:18,marginTop:18,gap:10},
  screenTab:{flex:1,paddingVertical:10,borderRadius:12,alignItems:'center',backgroundColor:COLORS.card,borderWidth:1.5,borderColor:COLORS.border},
  screenTabOn:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},
  screenTabTxt:{fontSize:14,fontWeight:'700',color:COLORS.textSecondary},
  screenTabTxtOn:{color:'#fff'},
  body:{flex:1,paddingTop:16},
  searchWrap:{paddingHorizontal:18,marginBottom:14},
  searchBar:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.card,borderRadius:16,paddingHorizontal:14,paddingVertical:12,shadowColor:COLORS.shadow,shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:3,borderWidth:1,borderColor:COLORS.border},
  searchIcon:{fontSize:16,marginRight:10},
  searchInput:{flex:1,fontSize:15,color:COLORS.text,paddingVertical:0},
  clearIcon:{fontSize:14,color:COLORS.textLight,fontWeight:'600',paddingLeft:8},
  tabsRow:{flexDirection:'row',paddingHorizontal:18,gap:8,marginBottom:12},
  tab:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:COLORS.card,borderRadius:12,paddingVertical:8,paddingHorizontal:4,gap:4,borderWidth:1.5,borderColor:COLORS.border},
  tabOn:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},
  tabLbl:{fontSize:11,fontWeight:'600',color:COLORS.textSecondary},
  tabLblOn:{color:'#fff'},
  tabCnt:{backgroundColor:COLORS.inputBg,borderRadius:8,paddingHorizontal:5,paddingVertical:1,minWidth:18,alignItems:'center'},
  tabCntOn:{backgroundColor:'rgba(255,255,255,0.25)'},
  tabCntTxt:{fontSize:10,fontWeight:'700',color:COLORS.textSecondary},
  tabCntTxtOn:{color:'#fff'},
  meta:{paddingHorizontal:20,marginBottom:10},
  metaTxt:{fontSize:13,color:COLORS.textSecondary,fontWeight:'500'},
  list:{paddingHorizontal:18,paddingBottom:100},
  listEmpty:{flex:1},
  loader:{flex:1,alignItems:'center',justifyContent:'center',gap:12},
  loaderTxt:{fontSize:15,color:COLORS.textSecondary,fontWeight:'500'},
  emptyBox:{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:64,paddingHorizontal:32},
  emptyEmoji:{fontSize:52,marginBottom:14},
  emptyTitle:{fontSize:18,fontWeight:'700',color:COLORS.text,marginBottom:8},
  emptySub:{fontSize:14,color:COLORS.textSecondary,textAlign:'center',lineHeight:20},
  classCard:{backgroundColor:COLORS.card,borderRadius:18,overflow:'hidden',shadowColor:COLORS.shadow,shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:3},
  stripe:{height:4},
  cardBody:{flexDirection:'row',alignItems:'center',padding:14},
  cardLeft:{flex:1,flexDirection:'row',alignItems:'flex-start'},
  av:{width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center',marginRight:12},
  avTxt:{color:'#fff',fontWeight:'800',fontSize:15},
  info:{flex:1,gap:4},
  clsName:{fontSize:16,fontWeight:'700',color:COLORS.text,letterSpacing:-0.2,marginBottom:2},
  infoRow:{flexDirection:'row',alignItems:'center',gap:5,flexWrap:'wrap'},
  infoIcon:{fontSize:12},
  infoTxt:{fontSize:12,color:COLORS.textSecondary,fontWeight:'500'},
  wBadge:{backgroundColor:COLORS.warningLight,borderRadius:6,paddingHorizontal:6,paddingVertical:1},
  wBadgeTxt:{fontSize:10,color:COLORS.warning,fontWeight:'700'},
  actions:{flexDirection:'column',gap:8,marginLeft:8},
  actBtn:{width:36,height:36,borderRadius:11,alignItems:'center',justifyContent:'center'},
  actIcon:{fontSize:15},
  subCard:{backgroundColor:COLORS.card,borderRadius:18,padding:14,flexDirection:'row',alignItems:'center',shadowColor:COLORS.shadow,shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:3,gap:12},
  subIconBox:{width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center'},
  subIcon:{fontSize:22},
  subInfo:{flex:1,gap:4},
  subName:{fontSize:15,fontWeight:'700',color:COLORS.text,letterSpacing:-0.1},
  fab:{position:'absolute',bottom:28,right:22,width:58,height:58,borderRadius:20,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',shadowColor:COLORS.primary,shadowOffset:{width:0,height:6},shadowOpacity:0.40,shadowRadius:14,elevation:10},
  fabIcon:{color:'#fff',fontSize:28,fontWeight:'300',lineHeight:32},
});

export default ClassesScreen;